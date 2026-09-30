import qrcodeGenerator from 'qrcode-generator';

export interface QRProcessResult {
  payload: string | null;
  imgB64: string | null;
  success: boolean;
  message: string;
}

/**
 * Safely resolves the QRCode generator factory function across bundler environments.
 */
function createQRCode(typeNumber = 0, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'): QRCode {
  let factory: any = qrcodeGenerator;
  if (typeof factory !== 'function' && factory?.default) {
    factory = factory.default;
  }
  if (typeof factory !== 'function' && typeof window !== 'undefined' && typeof (window as any).qrcode === 'function') {
    factory = (window as any).qrcode;
  }
  if (typeof factory !== 'function') {
    throw new Error('QR code generator library could not be loaded');
  }
  return factory(typeNumber, errorCorrectionLevel);
}

/**
 * Draws a crisp QR code onto an HTML Canvas with a 2-module quiet zone.
 */
export function drawQR(canvas: HTMLCanvasElement, payload: string, px = 640): void {
  if (!canvas || !payload) return;

  const qr = createQRCode(0, 'M');
  qr.addData(payload);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cell = Math.max(2, Math.floor(px / (moduleCount + 4)));
  const size = cell * (moduleCount + 4);

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // QR Modules with 2-cell quiet zone
  ctx.fillStyle = '#000000';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect((c + 2) * cell, (r + 2) * cell, cell, cell);
      }
    }
  }
}

/**
 * Loads an image/blob into an HTMLImageElement asynchronously.
 */
export function loadBitmap(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Dynamically and safely loads jsQR decoder to avoid Webpack 3 UMD bundle collision.
 */
async function getJsQRDecoder() {
  try {
    const mod = await import('jsqr');
    const fn = (mod as any).default || mod;
    return typeof fn === 'function' ? fn : (fn as any).jsQR || fn;
  } catch {
    if (typeof window !== 'undefined' && typeof (window as any).jsQR === 'function') {
      return (window as any).jsQR;
    }
    throw new Error('jsQR decoder could not be loaded');
  }
}

/**
 * Decodes uploaded or pasted image blob using jsQR with max 1200px downscaling.
 * If decoded, stores payload string only.
 * If decoding fails, keeps downscaled JPEG base64 (max ~150KB, 0.85 quality) as fallback.
 */
export async function processQRImage(blob: Blob): Promise<QRProcessResult> {
  try {
    const img = await loadBitmap(blob);
    const scale = Math.min(1, 800 / Math.max(img.width, img.height, 1));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }

    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const jsQR = await getJsQRDecoder();
    const code = jsQR(imageData.data, width, height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data) {
      // Validate that qrcode-generator can make it
      try {
        const testCanvas = document.createElement('canvas');
        drawQR(testCanvas, code.data, 200);
        return {
          payload: code.data,
          imgB64: null,
          success: true,
          message: 'QR verified and re-drawn sharp.',
        };
      } catch {
        // If qrcode-generator fails on special custom format, fall back to image
      }
    }

    // Fallback: JPEG base64 (downscaled to max 800px, 0.80 quality ~30-50KB)
    const imgB64 = canvas.toDataURL('image/jpeg', 0.80);
    return {
      payload: null,
      imgB64,
      success: false,
      message: "Couldn't read this QR, so the image is saved as is. Try a clearer screenshot.",
    };
  } catch (err) {
    return {
      payload: null,
      imgB64: null,
      success: false,
      message: err instanceof Error ? err.message : 'Failed to process image',
    };
  }
}
