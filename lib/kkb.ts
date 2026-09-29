/**
 * KKB (Kanya-Kanyang Bayad) Smart Bill Splitter Engine
 * Handles bill calculations, pax splitting, rounding modes,
 * text request formatting for group chats, and 1080x1350 canvas receipt generation.
 */

import { Card } from './schema';
import { fgFor, getCardGradientColors } from './colors';
import { drawQR, loadBitmap } from './qr';
import { findBankBrand, getBankLogoUrl } from './bank-logos';
import { embedAmountInQRPh, isEMVCoPayload } from './qr-ph';

export type KKBRoundingMode = 'exact' | 'up_1' | 'up_5' | 'up_10';

export interface KKBInput {
  totalBill: number;
  pax: number;
  rounding?: KKBRoundingMode;
}

export interface KKBResult {
  totalBill: number;
  pax: number;
  rawShare: number;
  roundedShare: number;
  roundingMode: KKBRoundingMode;
  roundingDiff: number;
}

export const PAX_PRESETS = [2, 3, 4, 5, 6, 8, 10];

/**
 * Calculates bill split and per-person shares with rounding.
 */
export function computeKKB(input: KKBInput): KKBResult {
  const totalBill = Math.max(0, input.totalBill || 0);
  const pax = Math.max(1, Math.floor(input.pax || 1));
  const roundingMode = input.rounding || 'exact';

  const rawShare = pax > 0 ? totalBill / pax : 0;

  let roundedShare = rawShare;
  switch (roundingMode) {
    case 'up_1':
      roundedShare = Math.ceil(rawShare);
      break;
    case 'up_5':
      roundedShare = Math.ceil(rawShare / 5) * 5;
      break;
    case 'up_10':
      roundedShare = Math.ceil(rawShare / 10) * 10;
      break;
    case 'exact':
    default:
      // Round to 2 decimal places
      roundedShare = Math.round(rawShare * 100) / 100;
      break;
  }

  const roundingDiff = Math.max(0, roundedShare * pax - totalBill);

  return {
    totalBill,
    pax,
    rawShare,
    roundedShare,
    roundingMode,
    roundingDiff,
  };
}

/**
 * Generates formatted text request summary ready for Messenger / Viber / WhatsApp.
 */
export function generateKKBTextRequest(
  card: Card,
  result: KKBResult,
  note?: string | null
): string {
  const formattedTotal = `₱${result.totalBill.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const formattedShare = `₱${result.roundedShare.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const noteLine = note?.trim() ? `\n📝 Note: "${note.trim()}"` : '';

  return `🍽️ KKB Bill Split (${result.pax} people)
━━━━━━━━━━━━━━━━━━━━━
🧾 Total Bill: ${formattedTotal}
👥 Split: ${result.pax} people
━━━━━━━━━━━━━━━━━━━━━
👉 YOUR SHARE: ${formattedShare} / person
━━━━━━━━━━━━━━━━━━━━━
💳 Pay via ${card.provider}:
• Account Name: ${card.holder || 'Payment Recipient'}
• Account / Mobile: ${card.number || 'Scan QR Ph'}
${noteLine}
⚡ Skip the queue. Flash your QueueR.`;
}

/**
 * Draws a rounded rectangle path on canvas.
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
 * Generates a high-resolution 1080x1350 KKB Bill Split Receipt image.
 */
export async function generateKKBReceiptCanvas(
  card: Card,
  result: KKBResult,
  note?: string | null
): Promise<HTMLCanvasElement> {
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const { c1, c2 } = getCardGradientColors(card.color);
  const fg = fgFor(card.color);

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Ambient curves
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH * 0.85, CANVAS_HEIGHT * 0.08, 380, 0, Math.PI * 2);
  ctx.fill();

  // 2. Header: App Name & KKB Title
  const headerY = 110;
  ctx.fillStyle = fg;
  ctx.font = '800 42px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('QueueR · KKB BILL SPLIT', CANVAS_WIDTH / 2, headerY);

  if (note?.trim()) {
    ctx.font = '500 28px Inter, sans-serif';
    ctx.fillStyle = fg === '#FFFFFF' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(29, 29, 31, 0.85)';
    ctx.fillText(`"${note.trim()}"`, CANVAS_WIDTH / 2, headerY + 45);
  }

  // 3. Receipt White Card Container
  const cardW = 920;
  const cardH = 990;
  const cardX = (CANVAS_WIDTH - cardW) / 2;
  const cardY = note?.trim() ? 200 : 180;
  const cardRadius = 36;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.restore();

  // 4. Receipt Header inside card (Provider + Holder)
  let innerY = cardY + 50;

  // Provider Logo & Name
  const brand = findBankBrand(card.provider);
  const logoUrl = card.logoB64 || (brand?.domain ? getBankLogoUrl(brand.domain, 128) : null);
  let drawnLogo = false;

  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const blob = await res.blob();
        const logoImg = await loadBitmap(blob);
        const bSize = 54;
        const text = `${card.provider} Payment`;
        ctx.font = '700 32px Inter, sans-serif';
        const tMetrics = ctx.measureText(text);
        const totalW = bSize + 16 + tMetrics.width;
        const sX = (CANVAS_WIDTH - totalW) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sX + bSize / 2, innerY, bSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, sX, innerY - bSize / 2, bSize, bSize);
        ctx.restore();

        ctx.fillStyle = '#1D1D1F';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, sX + bSize + 16, innerY);
        drawnLogo = true;
      }
    } catch {
      // Fallback
    }
  }

  if (!drawnLogo) {
    ctx.fillStyle = '#1D1D1F';
    ctx.font = '700 34px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${card.provider} Payment`, CANVAS_WIDTH / 2, innerY);
  }

  innerY += 45;

  // Holder & Account line
  ctx.fillStyle = '#6E6E73';
  ctx.font = '500 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  const holderText = card.holder ? `${card.holder}` : '';
  const numText = card.number ? ` · ${card.number}` : '';
  ctx.fillText(`${holderText}${numText}`, CANVAS_WIDTH / 2, innerY);

  innerY += 35;

  // Dashed divider line
  ctx.save();
  ctx.strokeStyle = '#D1D1D6';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(cardX + 40, innerY);
  ctx.lineTo(cardX + cardW - 40, innerY);
  ctx.stroke();
  ctx.restore();

  innerY += 35;

  // 5. Bill Summary Breakdown Rows
  const rowLeftX = cardX + 60;
  const rowRightX = cardX + cardW - 60;

  ctx.font = '500 24px Inter, sans-serif';
  ctx.fillStyle = '#6E6E73';
  ctx.textAlign = 'left';
  ctx.fillText('Total Bill Amount', rowLeftX, innerY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1D1D1F';
  ctx.font = '600 24px Inter, sans-serif';
  ctx.fillText(`₱${result.totalBill.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, rowRightX, innerY);

  innerY += 40;

  ctx.font = '500 24px Inter, sans-serif';
  ctx.fillStyle = '#6E6E73';
  ctx.textAlign = 'left';
  ctx.fillText('Total People (Pax)', rowLeftX, innerY);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1D1D1F';
  ctx.font = '600 24px Inter, sans-serif';
  ctx.fillText(`${result.pax} people`, rowRightX, innerY);

  innerY += 45;

  // 6. Highlighted "EACH PERSON PAYS" Banner
  const shareBoxW = cardW - 100;
  const shareBoxH = 110;
  const shareBoxX = (CANVAS_WIDTH - shareBoxW) / 2;
  const shareBoxY = innerY;

  ctx.save();
  ctx.fillStyle = '#F5F5F7';
  roundRect(ctx, shareBoxX, shareBoxY, shareBoxW, shareBoxH, 20);
  ctx.fill();
  ctx.strokeStyle = '#E5E5EA';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#6E6E73';
  ctx.font = '700 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EACH PERSON PAYS', CANVAS_WIDTH / 2, shareBoxY + 34);

  ctx.fillStyle = '#007AFF';
  ctx.font = '800 46px Inter, sans-serif';
  ctx.fillText(
    `₱${result.roundedShare.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    CANVAS_WIDTH / 2,
    shareBoxY + 78
  );
  ctx.restore();

  innerY += shareBoxH + 35;

  // 7. Dynamic Embedded QR Code
  const qrSize = 360;
  const qrX = (CANVAS_WIDTH - qrSize) / 2;
  const qrY = innerY;

  let payloadToDraw = card.payload;
  if (card.payload && isEMVCoPayload(card.payload)) {
    payloadToDraw = embedAmountInQRPh(
      card.payload,
      result.roundedShare,
      `KKB (${result.pax} pax)`
    );
  }

  if (payloadToDraw) {
    const tempCanvas = document.createElement('canvas');
    drawQR(tempCanvas, payloadToDraw, qrSize);
    ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize);
  } else if (card.imgB64) {
    try {
      const res = await fetch(card.imgB64);
      const blob = await res.blob();
      const qrImg = await loadBitmap(blob);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch {
      // Fallback placeholder
    }
  }

  // 8. Footer Line
  ctx.fillStyle = fg === '#FFFFFF' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(29, 29, 31, 0.8)';
  ctx.font = '600 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan with GCash, Maya, BPI, SeaBank, or any QR Ph App', CANVAS_WIDTH / 2, 1265);

  return canvas;
}
