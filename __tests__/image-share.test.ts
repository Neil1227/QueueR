import { describe, it, expect } from 'vitest';
import { generateShareCanvas, CANVAS_WIDTH, CANVAS_HEIGHT } from '../lib/image-share';
import { Card } from '../lib/schema';

describe('Image Share Engine', () => {
  const testCard: Card = {
    id: 'test-card-1',
    provider: 'GCash',
    color: '#007DFE',
    holder: 'Juan Dela Cruz',
    number: '0917 123 4567',
    label: 'Personal',
    payload: 'https://qr.gcash.com/pay-me',
    isDefault: true,
    useCount: 1,
    lastUsedAt: 100,
    createdAt: 100,
    updatedAt: 100,
    v: 1,
  };

  it('generates a canvas with exact 1080x1350 dimensions (4:5)', async () => {
    const canvas = await generateShareCanvas(testCard, {
      numberFormat: 'last4',
      footerText: 'Scan to pay',
    });

    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(CANVAS_WIDTH);
    expect(canvas.height).toBe(CANVAS_HEIGHT);
    expect(canvas.width).toBe(1080);
    expect(canvas.height).toBe(1350);
  });

  it('supports hidden and full number formats in share image', async () => {
    const hiddenCanvas = await generateShareCanvas(testCard, {
      numberFormat: 'hidden',
    });
    expect(hiddenCanvas.width).toBe(1080);
    expect(hiddenCanvas.height).toBe(1350);

    const fullCanvas = await generateShareCanvas(testCard, {
      numberFormat: 'full',
    });
    expect(fullCanvas.width).toBe(1080);
    expect(fullCanvas.height).toBe(1350);
  });
});
