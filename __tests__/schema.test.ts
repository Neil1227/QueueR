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

  it('validates a zero-knowledge encrypted card with payloadEnc and holderEnc', () => {
    const encryptedCard = {
      id: 'card-enc-123',
      provider: 'GCash',
      color: '#007DFE',
      holder: '',
      holderEnc: 'enc:v1:YWJjZGVmZ2hpams=:YWJjZGVmZ2hpamtsbW5vcA==',
      number: '',
      numberEnc: 'enc:v1:YWJjZGVmZ2hpams=:YWJjZGVmZ2hpamtsbW5vcA==',
      label: 'Encrypted Personal Card',
      category: 'personal',
      payload: null,
      payloadEnc: 'enc:v1:YWJjZGVmZ2hpams=:YWJjZGVmZ2hpamtsbW5vcA==',
      isDefault: true,
      useCount: 0,
      lastUsedAt: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      v: 1,
    };

    const res = CardSchema.safeParse(encryptedCard);
    expect(res.success).toBe(true);
  });
});
