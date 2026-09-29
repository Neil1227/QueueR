import { describe, it, expect } from 'vitest';
import { computeKKB, generateKKBTextRequest } from '../lib/kkb';
import { Card } from '../lib/schema';

describe('KKB Bill Splitter Engine', () => {
  const dummyCard: Card = {
    id: 'test-card-1',
    provider: 'GCash',
    color: '#007DFE',
    holder: 'Juan Dela Cruz',
    number: '0917 123 4567',
    label: 'Main',
    category: 'personal',
    payload: '00020101021153036085802PH5913JUAN DELA CRUZ6011QUEZON CITY6304ABCD',
    isDefault: true,
    useCount: 1,
    lastUsedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    v: 1,
  };

  it('correctly calculates equal split with no tip', () => {
    const result = computeKKB({
      totalBill: 1200,
      pax: 4,
      rounding: 'exact',
    });

    expect(result.subtotal).toBe(1200);
    expect(result.tipAmount).toBe(0);
    expect(result.grandTotal).toBe(1200);
    expect(result.pax).toBe(4);
    expect(result.rawShare).toBe(300);
    expect(result.roundedShare).toBe(300);
    expect(result.roundingDiff).toBe(0);
  });

  it('correctly calculates percentage tip and split', () => {
    const result = computeKKB({
      totalBill: 1000,
      tipPercent: 10,
      pax: 4,
      rounding: 'exact',
    });

    expect(result.subtotal).toBe(1000);
    expect(result.tipPercent).toBe(10);
    expect(result.tipAmount).toBe(100);
    expect(result.grandTotal).toBe(1100);
    expect(result.roundedShare).toBe(275);
  });

  it('handles centavo precision under exact rounding', () => {
    const result = computeKKB({
      totalBill: 1000,
      pax: 3,
      rounding: 'exact',
    });

    expect(result.rawShare).toBeCloseTo(333.333, 2);
    expect(result.roundedShare).toBe(333.33);
  });

  it('handles round up to ₱1 (up_1)', () => {
    const result = computeKKB({
      totalBill: 1000,
      pax: 3,
      rounding: 'up_1',
    });

    expect(result.roundedShare).toBe(334);
    expect(result.roundingDiff).toBe(2); // 334 * 3 = 1002 (diff 2)
  });

  it('handles round up to ₱5 (up_5)', () => {
    const result = computeKKB({
      totalBill: 1000,
      pax: 3,
      rounding: 'up_5',
    });

    expect(result.roundedShare).toBe(335);
    expect(result.roundingDiff).toBe(5); // 335 * 3 = 1005 (diff 5)
  });

  it('handles round up to ₱10 (up_10)', () => {
    const result = computeKKB({
      totalBill: 1450,
      pax: 4,
      rounding: 'up_10',
    });

    // 1450 / 4 = 362.50 -> rounds up to 370
    expect(result.roundedShare).toBe(370);
  });

  it('handles custom tip/extra fee', () => {
    const result = computeKKB({
      totalBill: 800,
      customTip: 150,
      pax: 2,
    });

    expect(result.grandTotal).toBe(950);
    expect(result.roundedShare).toBe(475);
  });

  it('handles minimum pax edge case (pax = 0 or negative)', () => {
    const result = computeKKB({
      totalBill: 500,
      pax: 0,
    });

    expect(result.pax).toBe(1);
    expect(result.roundedShare).toBe(500);
  });

  it('generates a clean clipboard-ready text summary', () => {
    const result = computeKKB({
      totalBill: 1450,
      tipPercent: 10,
      pax: 4,
      rounding: 'exact',
    });

    const text = generateKKBTextRequest(dummyCard, result, 'Dinner with Team');
    expect(text).toContain('KKB Bill Split (4 people)');
    expect(text).toContain('Total Bill: ₱1,450.00');
    expect(text).toContain('Service / Tip (10%): ₱145.00');
    expect(text).toContain('Grand Total: ₱1,595.00');
    expect(text).toContain('YOUR SHARE: ₱398.75 / person');
    expect(text).toContain('GCash');
    expect(text).toContain('Juan Dela Cruz');
    expect(text).toContain('0917 123 4567');
    expect(text).toContain('Dinner with Team');
  });
});
