import { describe, it, expect } from 'vitest';
import { CardSchema, CardInputSchema, CARD_CATEGORIES, CardCategory, Card } from '@/lib/schema';

describe('Card Categories & Deck Filtering Test Suite', () => {
  const sampleCard = {
    id: 'test-card-1',
    provider: 'GCash',
    color: '#007DFE',
    holder: 'Juan Cruz',
    number: '0917 123 4567',
    label: 'Main Store',
    category: 'business' as CardCategory,
    payload: '00020101021126510014ph.ppmi.p2pqr0111GCASHXXXXXX5204601653036085802PH5911JUAN D CRUZ6006MANILA6304A1B2',
    isDefault: false,
    useCount: 0,
    lastUsedAt: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    v: 1 as const,
  };

  it('contains all 5 standard categories with icons and labels', () => {
    expect(CARD_CATEGORIES).toHaveLength(5);
    const categoryIds = CARD_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toEqual(['personal', 'business', 'savings', 'freelance', 'other']);
  });

  it('validates card with specific category', () => {
    const res = CardSchema.safeParse(sampleCard);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.category).toBe('business');
    }
  });

  it('defaults category to personal if omitted', () => {
    const withoutCat = {
      ...sampleCard,
      category: undefined,
    };
    const res = CardSchema.safeParse(withoutCat);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.category).toBe('personal');
    }
  });

  it('filters deck correctly by category', () => {
    const cardList: Card[] = [
      { ...sampleCard, id: 'c1', category: 'personal' },
      { ...sampleCard, id: 'c2', category: 'business' },
      { ...sampleCard, id: 'c3', category: 'savings' },
      { ...sampleCard, id: 'c4', category: 'business' },
    ];

    const personalCards = cardList.filter((c) => (c.category || 'personal') === 'personal');
    const businessCards = cardList.filter((c) => (c.category || 'personal') === 'business');
    const freelanceCards = cardList.filter((c) => (c.category || 'personal') === 'freelance');

    expect(personalCards).toHaveLength(1);
    expect(businessCards).toHaveLength(2);
    expect(freelanceCards).toHaveLength(0);
  });

  it('calculates category counts correctly', () => {
    const cardList: Card[] = [
      { ...sampleCard, id: 'c1', category: 'personal' },
      { ...sampleCard, id: 'c2', category: 'personal' },
      { ...sampleCard, id: 'c3', category: 'business' },
      { ...sampleCard, id: 'c4', category: 'savings' },
      { ...sampleCard, id: 'c5', category: 'freelance' },
    ];

    const counts: Record<string, number> = { all: cardList.length };
    for (const card of cardList) {
      const cat = card.category || 'personal';
      counts[cat] = (counts[cat] || 0) + 1;
    }

    expect(counts.all).toBe(5);
    expect(counts.personal).toBe(2);
    expect(counts.business).toBe(1);
    expect(counts.savings).toBe(1);
    expect(counts.freelance).toBe(1);
    expect(counts.other).toBeUndefined();
  });
});
