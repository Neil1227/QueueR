import { describe, it, expect } from 'vitest';
import { drawQR } from '../lib/qr';
import qrcode from 'qrcode-generator';

describe('QR utilities', () => {
  it('generates valid QR matrix with qrcode-generator', () => {
    const qr = qrcode(0, 'M');
    qr.addData('https://example.com/payment');
    qr.make();
    expect(qr.getModuleCount()).toBeGreaterThan(10);
  });

  it('draws QR onto canvas without throwing', () => {
    const canvas = document.createElement('canvas');
    expect(() => drawQR(canvas, 'https://qr.gcash.com/pay', 300)).not.toThrow();
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it('safely handles non-image blob in processQRImage', async () => {
    const { processQRImage } = await import('../lib/qr');
    const blob = new Blob(['not an image'], { type: 'text/plain' });
    const result = await processQRImage(blob);
    expect(result.success).toBe(false);
    expect(result.payload).toBeNull();
  });
});
