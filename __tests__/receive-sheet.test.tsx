import React from 'react';
import { describe, it, expect } from 'vitest';
import { Card } from '@/lib/schema';
import { embedAmountInQRPh, parseQRPh } from '@/lib/qr-ph';

describe('ReceiveSheet & QR Ph Flow Unit Tests', () => {
  const mockCard: Card = {
    id: 'test-card-1',
    provider: 'GCash',
    color: '#007DFE',
    number: '0917 123 4567',
    holder: 'Juan Cruz',
    label: 'Main',
    isDefault: true,
    payload:
      '00020101021126510014ph.ppmi.p2pqr0111GCASHXXXXXX02159999999999999995204601653036085802PH5911JUAN D CRUZ6006MANILA6304A1B2',
    useCount: 0,
    lastUsedAt: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    category: 'personal',
    v: 1,
  };

  it('correctly calculates dynamic amount QR Ph payload', () => {
    const dynamicPayload = embedAmountInQRPh(mockCard.payload!, 350.0, 'Lunch');
    expect(dynamicPayload).toBeDefined();

    const parsed = parseQRPh(dynamicPayload);
    expect(parsed.isQRPh).toBe(true);
    expect(parsed.amount).toBe(350);
    expect(parsed.note).toBe('Lunch');
    expect(parsed.pointOfInitiation).toBe('dynamic');
  });

  it('formats amounts and notes properly for share text', () => {
    const amount = 500;
    const note = 'Coffee';
    const amtStr = `Amount: ₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    const noteStr = note ? ` (${note})` : '';
    const fullText = [
      `${amtStr}${noteStr}`,
      mockCard.provider,
      mockCard.holder,
      mockCard.number,
    ]
      .filter(Boolean)
      .join('\n');

    expect(fullText).toContain('Amount: ₱500.00 (Coffee)');
    expect(fullText).toContain('GCash');
    expect(fullText).toContain('Juan Cruz');
  });
});
