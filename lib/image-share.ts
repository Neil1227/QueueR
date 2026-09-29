/**
 * Canvas Image Share Engine:
 * Generates a high-resolution 1080x1350 (4:5) PNG with:
 * - Brand color gradient
 * - Large provider wordmark or custom uploaded logo
 * - White rounded QR container (radius 48px, min 720px QR, 2-module quiet zone)
 * - Holder name and formatted account number
 * - Editable footer line ("Scan to pay")
 * - Native Web Share API with download fallback
 */
import { Card } from './schema';
import { fgFor, getCardGradientColors } from './colors';
import { drawQR, loadBitmap } from './qr';
import { formatPreviewNumber, PreviewNumberFormat } from './cards';
import { findBankBrand, getBankLogoUrl } from './bank-logos';

export interface ImageShareOptions {
  numberFormat?: PreviewNumberFormat;
  footerText?: string;
}

export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

/**
 * Draws a rounded rectangle path on a 2D canvas context.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Renders the full 1080x1350 share image on an HTML Canvas.
 */
export async function generateShareCanvas(
  card: Card,
  options: ImageShareOptions = {}
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const { c1, c2 } = getCardGradientColors(card.color);
  const fg = fgFor(card.color);
  const numberFormat = options.numberFormat || 'last4';
  const footerText = options.footerText || 'Scan to pay';

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Subtle ambient light curves
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH * 0.9, CANVAS_HEIGHT * 0.1, 400, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH * 0.1, CANVAS_HEIGHT * 0.9, 350, 0, Math.PI * 2);
  ctx.fill();

  // 2. Top Header / Wordmark or Custom/API Logo
  const headerY = 130;
  const brand = findBankBrand(card.provider);
  const logoUrl = card.logoB64 || (brand?.domain ? getBankLogoUrl(brand.domain, 128) : null);

  let drawnLogo = false;
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const blob = await res.blob();
        const logoImg = await loadBitmap(blob);
        const badgeSize = 72;
        const text = card.provider + (card.label ? ` · ${card.label}` : '');
        ctx.font = '700 44px Inter, -apple-system, sans-serif';
        const textMetrics = ctx.measureText(text);
        const totalWidth = badgeSize + 20 + textMetrics.width;
        const startX = (CANVAS_WIDTH - totalWidth) / 2;

        // Draw white badge background
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(startX + badgeSize / 2, headerY, badgeSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw image inside circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(startX + badgeSize / 2, headerY, (badgeSize - 8) / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, startX + 4, headerY - (badgeSize - 8) / 2, badgeSize - 8, badgeSize - 8);
        ctx.restore();

        // Draw provider text
        ctx.fillStyle = fg;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, startX + badgeSize + 20, headerY);
        drawnLogo = true;
      }
    } catch {
      // Fallback to text wordmark
    }
  }

  if (!drawnLogo) {
    renderWordmark(ctx, card, headerY, fg);
  }

  // 3. Center White Rounded Box (QR Container)
  const boxSize = 780;
  const boxX = (CANVAS_WIDTH - boxSize) / 2;
  const boxY = 220;
  const boxRadius = 48;

  // Box Drop Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, boxX, boxY, boxSize, boxSize, boxRadius);
  ctx.fill();
  ctx.restore();

  // QR Code Rendering inside white box
  const qrInnerSize = 700;
  const qrPadding = (boxSize - qrInnerSize) / 2;
  const qrX = boxX + qrPadding;
  const qrY = boxY + qrPadding;

  if (card.payload) {
    const tempCanvas = document.createElement('canvas');
    drawQR(tempCanvas, card.payload, qrInnerSize);
    ctx.drawImage(tempCanvas, qrX, qrY, qrInnerSize, qrInnerSize);
  } else if (card.imgB64) {
    try {
      const res = await fetch(card.imgB64);
      const blob = await res.blob();
      const qrImg = await loadBitmap(blob);
      ctx.drawImage(qrImg, qrX, qrY, qrInnerSize, qrInnerSize);
    } catch {
      // If image fails, draw placeholder
      ctx.fillStyle = '#999999';
      ctx.font = '500 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Payment QR Code', CANVAS_WIDTH / 2, boxY + boxSize / 2);
    }
  }

  // 4. Details Below QR (Holder Name & Formatted Number)
  let currentY = boxY + boxSize + 70;

  // Holder Name
  if (card.holder) {
    ctx.fillStyle = fg;
    ctx.font = '700 44px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.holder, CANVAS_WIDTH / 2, currentY);
    currentY += 50;
  }

  // Account Number
  const formattedNum = formatPreviewNumber(card.number, numberFormat);
  if (formattedNum) {
    ctx.fillStyle = fg === '#FFFFFF' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(29, 29, 31, 0.92)';
    ctx.font = '600 38px "SF Mono", Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formattedNum, CANVAS_WIDTH / 2, currentY);
    currentY += 45;
  }

  // 5. Footer Line ("Scan to pay")
  if (footerText) {
    ctx.fillStyle = fg === '#FFFFFF' ? 'rgba(255, 255, 255, 0.72)' : 'rgba(29, 29, 31, 0.72)';
    ctx.font = '500 28px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(footerText, CANVAS_WIDTH / 2, 1260);
  }

  return canvas;
}

function renderWordmark(ctx: CanvasRenderingContext2D, card: Card, y: number, fg: string) {
  ctx.fillStyle = fg;
  ctx.font = '700 48px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const text = card.provider + (card.label ? ` · ${card.label}` : '');
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

/**
 * Downloads a canvas as a PNG file directly in the browser.
 */
export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Shares canvas image using Web Share API or falls back to download.
 */
export async function shareOrDownloadImage(
  canvas: HTMLCanvasElement,
  providerName: string
): Promise<{ shared: boolean; downloaded: boolean }> {
  const filename = `${providerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.png`;

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    downloadCanvasAsPNG(canvas, filename);
    return { shared: false, downloaded: true };
  }

  const file = new File([blob], filename, { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `${providerName} Payment QR`,
        text: `Scan to pay via ${providerName}`,
      });
      return { shared: true, downloaded: false };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { shared: false, downloaded: false };
      }
    }
  }

  // Fallback to direct download
  downloadCanvasAsPNG(canvas, filename);
  return { shared: false, downloaded: true };
}
