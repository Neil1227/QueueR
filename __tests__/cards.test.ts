import { describe, it, expect } from 'vitest';
import {
  last4,
  maskedNumber,
  sortCards,
  bringToFront,
  formatPreviewNumber,
  formatInputAccountNumber,
  getCachedCards,
  setCachedCards,
  clearCachedCards,
} from '../lib/cards';
import { Card } from '../lib/schema';

describe('Cards utilities', () => {
  describe('formatInputAccountNumber', () => {
    it('formats Philippine 11-digit mobile numbers as 4-3-4', () => {
      expect(formatInputAccountNumber('09171234567')).toBe('0917 123 4567');
      expect(formatInputAccountNumber('09189998888')).toBe('0918 999 8888');
    });

    it('formats mobile numbers with +63 prefix', () => {
      expect(formatInputAccountNumber('+639171234567')).toBe('+63 917 123 4567');
    });

    it('formats 16-digit card / account numbers as 4-4-4-4', () => {
      expect(formatInputAccountNumber('1234567812345678')).toBe('1234 5678 1234 5678');
    });

    it('formats 12-digit bank accounts as 4-4-4', () => {
      expect(formatInputAccountNumber('123456789012')).toBe('1234 5678 9012');
    });

    it('formats 10-digit bank accounts as 4-4-2', () => {
      expect(formatInputAccountNumber('1234567890')).toBe('1234 5678 90');
    });

    it('formats 14-digit bank accounts in chunks of 4', () => {
      expect(formatInputAccountNumber('12345678901234')).toBe('1234 5678 9012 34');
    });

    it('handles empty and partial typing cleanly', () => {
      expect(formatInputAccountNumber('')).toBe('');
      expect(formatInputAccountNumber('0917')).toBe('0917');
      expect(formatInputAccountNumber('09171')).toBe('0917 1');
    });
  });

  describe('last4', () => {
    it('handles spaced numbers', () => {
      expect(last4('0917 123 4567')).toBe('4567');
    });

    it('handles numbers with dashes', () => {
      expect(last4('1234-5678-9012')).toBe('9012');
    });

    it('handles letters mixed in', () => {
      expect(last4('ABC1234XYZ5678')).toBe('5678');
      expect(last4('PH9988')).toBe('9988');
    });

    it('handles fewer than 4 digits', () => {
      expect(last4('12')).toBe('12');
      expect(last4('7')).toBe('7');
    });

    it('handles empty value, null, or undefined', () => {
      expect(last4('')).toBe('');
      expect(last4('   ')).toBe('');
      expect(last4(null)).toBe('');
      expect(last4(undefined)).toBe('');
    });
  });

  describe('formatPreviewNumber', () => {
    const num = '0917 123 4567';

    it('formats as last4 by default or when specified', () => {
      expect(formatPreviewNumber(num, 'last4')).toBe('•••• 4567');
      expect(formatPreviewNumber(num)).toBe('•••• 4567');
    });

    it('hides number when format is hidden', () => {
      expect(formatPreviewNumber(num, 'hidden')).toBe('');
    });

    it('shows full number when format is full', () => {
      expect(formatPreviewNumber(num, 'full')).toBe(num);
    });

    it('handles empty or missing numbers', () => {
      expect(formatPreviewNumber('', 'last4')).toBe('');
      expect(formatPreviewNumber(null, 'full')).toBe('');
    });
  });

  describe('maskedNumber', () => {
    it('returns masked format •••• 1234', () => {
      expect(maskedNumber({ number: '09171234567' } as Card)).toBe('•••• 4567');
      expect(maskedNumber({ number: '' } as Card)).toBe('');
      expect(maskedNumber(null)).toBe('');
    });
  });

  describe('sortCards', () => {
    it('sorts default card first, then by useCount desc, then lastUsedAt desc', () => {
      const cardA: Card = {
        id: '1',
        provider: 'GCash',
        color: '#007DFE',
        holder: 'User A',
        number: '1111',
        isDefault: false,
        useCount: 10,
        lastUsedAt: 100,
        createdAt: 100,
        updatedAt: 100,
        payload: 'test-a',
        v: 1,
      };

      const cardB: Card = {
        id: '2',
        provider: 'Maya',
        color: '#1FBF6B',
        holder: 'User B',
        number: '2222',
        isDefault: true,
        useCount: 2,
        lastUsedAt: 50,
        createdAt: 100,
        updatedAt: 100,
        payload: 'test-b',
        v: 1,
      };

      const cardC: Card = {
        id: '3',
        provider: 'BPI',
        color: '#B3151B',
        holder: 'User C',
        number: '3333',
        isDefault: false,
        useCount: 20,
        lastUsedAt: 200,
        createdAt: 100,
        updatedAt: 100,
        payload: 'test-c',
        v: 1,
      };

      const sorted = sortCards([cardA, cardB, cardC]);
      expect(sorted.map((c) => c.id)).toEqual(['2', '3', '1']);
    });
  });

  describe('bringToFront deck reordering', () => {
    const deck = [
      { id: 'A', name: 'Card A' },
      { id: 'B', name: 'Card B' },
      { id: 'C', name: 'Card C' },
      { id: 'D', name: 'Card D' },
    ];

    it('reorders [A, B, C, D] when tapping C -> [C, B, D, A]', () => {
      const result = bringToFront(deck, 'C');
      expect(result.map((c) => c.id)).toEqual(['C', 'B', 'D', 'A']);
    });

    it('reorders [A, B, C, D] when tapping D -> [D, B, C, A]', () => {
      const result = bringToFront(deck, 'D');
      expect(result.map((c) => c.id)).toEqual(['D', 'B', 'C', 'A']);
    });

    it('does not change deck when tapping the front card A -> [A, B, C, D]', () => {
      const result = bringToFront(deck, 'A');
      expect(result.map((c) => c.id)).toEqual(['A', 'B', 'C', 'D']);
    });

    it('handles single card or empty deck gracefully', () => {
      expect(bringToFront([{ id: 'A' }], 'A')).toEqual([{ id: 'A' }]);
      expect(bringToFront([], 'A')).toEqual([]);
    });
  });

  describe('User-isolated local cache', () => {
    it('isolates cache per user ID and prevents leaking across users', () => {
      const userCards: Card[] = [
        {
          id: 'card-u1',
          provider: 'GCash',
          color: '#007DFE',
          holder: 'User 1',
          number: '0917 111 2222',
          isDefault: true,
          useCount: 0,
          lastUsedAt: 0,
          createdAt: 0,
          updatedAt: 0,
          v: 1,
        },
      ];

      setCachedCards(userCards, 'user_abc_123');
      expect(getCachedCards('user_abc_123')).toHaveLength(1);
      expect(getCachedCards('local-guest-999')).toHaveLength(0);

      clearCachedCards('user_abc_123');
      expect(getCachedCards('user_abc_123')).toHaveLength(0);
    });
  });
});
