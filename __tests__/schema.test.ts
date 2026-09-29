import { describe, it, expect } from 'vitest';
import { CardSchema, CardInputSchema } from '../lib/schema';

describe('Schema validation', () => {
  it('validates a correct card object', () => {
    const validCard = {
      id: 'card-123',
      provider: 'GCash',
      color: '#007DFE',
      holder: 'Juan Dela Cruz',
      number: '0917 123 4567',
      label: 'Personal',
      payload: 'https://qr.gcash.com/example',
      isDefault: true,
      useCount: 5,
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      v: 1,
    };

    const res = CardSchema.safeParse(validCard);
    expect(res.success).toBe(true);
  });

  it('rejects a card missing payload, payloadEnc, and imgB64', () => {
    const invalidCard = {
      id: 'card-123',
      provider: 'GCash',
      color: '#007DFE',
      holder: 'Juan Dela Cruz',
      number: '0917 123 4567',
      isDefault: false,
    };

    const res = CardSchema.safeParse(invalidCard);
    expect(res.success).toBe(false);
  });

  it('rejects an invalid hex color', () => {
    const invalidCard = {
      id: 'card-123',
      provider: 'GCash',
      color: 'not-a-color',
      payload: 'test',
    };

    const res = CardSchema.safeParse(invalidCard);
    expect(res.success).toBe(false);
  });

  it('validates CardInput correctly', () => {
    const valid = CardInputSchema.safeParse({
      provider: 'Maya',
      color: '#1FBF6B',
      holder: 'Maria Clara',
      number: '0918 000 0000',
      payload: 'qr-data',
      isDefault: false,
    });
    expect(valid.success).toBe(true);
  });
});
