import { Card } from './schema';

export type PreviewNumberFormat = 'last4' | 'hidden' | 'full';

export const PREVIEW_NUMBER_FORMAT_KEY = 'qr_wallet_preview_number_format_v1';

/**
 * Extracts last 4 digits from an account/phone number.
 * Strips non-digit characters first, then takes up to the last 4 digits.
 */
export function last4(num?: string | null): string {
  if (!num) return '';
  const digits = num.replace(/\D/g, '');
  return digits.slice(-4);
}

/**
 * Returns formatted number for preview strips based on user's privacy setting.
 */
export function formatPreviewNumber(
  num?: string | null,
  format: PreviewNumberFormat = 'last4'
): string {
  if (!num || !num.trim()) return '';
  if (format === 'hidden') return '';
  if (format === 'full') return num;
  const l4 = last4(num);
  return l4 ? `•••• ${l4}` : '';
}

/**
 * Automatically formats an account or mobile number with smart spacing as typed:
 * - Philippine Mobile (09XX XXX XXXX - 4-3-4): e.g. "0917 123 4567"
 * - International Mobile (+63 9XX XXX XXXX): e.g. "+63 917 123 4567"
 * - 16-digit Card / Virtual Account (4-4-4-4): e.g. "1234 5678 1234 5678"
 * - 12-digit Bank Account (4-4-4): e.g. "1234 5678 9012"
 * - 10-digit Bank Account (4-4-2): e.g. "1234 5678 90"
 * - General Bank Accounts: Groups of 4 digits (e.g. "1234 5678 9012 34")
 */
export function formatInputAccountNumber(raw?: string | null): string {
  if (!raw) return '';

  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (!digits) return hasPlus ? '+' : '';

  // 1. Mobile with +63 prefix
  if (hasPlus && digits.startsWith('63')) {
    const rest = digits.slice(2);
    if (rest.length === 0) return '+63 ';
    if (rest.length <= 3) return `+63 ${rest}`;
    if (rest.length <= 6) return `+63 ${rest.slice(0, 3)} ${rest.slice(3)}`;
    return `+63 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
  }

  // 2. Mobile with 63 prefix (without leading +)
  if (digits.startsWith('63') && digits.length >= 10 && digits.length <= 12) {
    const rest = digits.slice(2);
    if (rest.length <= 3) return `63 ${rest}`;
    if (rest.length <= 6) return `63 ${rest.slice(0, 3)} ${rest.slice(3)}`;
    return `63 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 10)}`;
  }

  // 3. Philippine 11-digit mobile starting with '09' (4-3-4)
  if (digits.startsWith('09') && digits.length <= 11) {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  }

  // 4. 10-digit bank account (e.g. BPI: 4-4-2)
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }

  // 5. 12-digit bank account (e.g. BDO, Maya, UnionBank: 4-4-4)
  if (digits.length === 12) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  }

  // 6. 16-digit card / virtual account (4-4-4-4)
  if (digits.length === 16) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
  }

  // 7. General/Other Bank Accounts: Group in chunks of 4
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Strips formatting spaces from account number when needed.
 */
export function unformatAccountNumber(formatted?: string | null): string {
  if (!formatted) return '';
  const trimmed = formatted.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = formatted.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Returns masked number formatted as "•••• 1234" or empty if no number.
 */
export function maskedNumber(card?: Pick<Card, 'number'> | null): string {
  if (!card || !card.number) return '';
  const l4 = last4(card.number);
  return l4 ? `•••• ${l4}` : '';
}

/**
 * Sorts cards:
 * 1. Default card first (isDefault === true)
 * 2. Most used (useCount descending)
 * 3. Most recently used (lastUsedAt descending)
 * 4. Most recently created (createdAt descending)
 */
export function sortCards<T extends Card>(cardsList: T[]): T[] {
  return [...cardsList].sort((a, b) => {
    const aDef = a.isDefault ? 1 : 0;
    const bDef = b.isDefault ? 1 : 0;
    if (bDef !== aDef) return bDef - aDef;

    const aCount = a.useCount || 0;
    const bCount = b.useCount || 0;
    if (bCount !== aCount) return bCount - aCount;

    const aLast = a.lastUsedAt || 0;
    const bLast = b.lastUsedAt || 0;
    if (bLast !== aLast) return bLast - aLast;

    const aCreated = a.createdAt || 0;
    const bCreated = b.createdAt || 0;
    return bCreated - aCreated;
  });
}

/**
 * Reorders a card deck when a card behind the front card is tapped.
 * Rule: newDeck = [tapped, ...others, oldFront]
 * The tapped card moves to the front (index 0), the old front card moves to the back,
 * and all other cards maintain their relative order.
 */
export function bringToFront<T extends { id: string }>(deck: T[], id: string): T[] {
  if (!deck || deck.length <= 1) return deck;
  const targetIndex = deck.findIndex((c) => c.id === id);
  if (targetIndex <= 0) return deck;

  const tapped = deck[targetIndex];
  const oldFront = deck[0];
  const others = deck.filter((_, i) => i !== 0 && i !== targetIndex);

  return [tapped, ...others, oldFront];
}

/**
 * Local storage cache keys for instant offline access before Firebase initializes.
 */
export const LOCAL_CACHE_DEFAULT_KEY = 'qr_wallet_default_cache_v1';
export const LOCAL_CACHE_ALL_KEY = 'qr_wallet_cards_cache_v1';

export function getCachedDefaultCard(userId?: string | null): Card | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = userId ? `${LOCAL_CACHE_DEFAULT_KEY}_${userId}` : LOCAL_CACHE_DEFAULT_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Card;
    if (!userId) {
      const fallback = localStorage.getItem(LOCAL_CACHE_DEFAULT_KEY);
      return fallback ? (JSON.parse(fallback) as Card) : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedDefaultCard(card: Card | null, userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${LOCAL_CACHE_DEFAULT_KEY}_${userId}` : LOCAL_CACHE_DEFAULT_KEY;
    if (card) {
      localStorage.setItem(key, JSON.stringify(card));
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedCards(userId?: string | null): Card[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = userId ? `${LOCAL_CACHE_ALL_KEY}_${userId}` : LOCAL_CACHE_ALL_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Card[];
    if (!userId) {
      const fallback = localStorage.getItem(LOCAL_CACHE_ALL_KEY);
      return fallback ? (JSON.parse(fallback) as Card[]) : [];
    }
    return [];
  } catch {
    return [];
  }
}

export function setCachedCards(cards: Card[], userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = userId ? `${LOCAL_CACHE_ALL_KEY}_${userId}` : LOCAL_CACHE_ALL_KEY;
    localStorage.setItem(key, JSON.stringify(cards));
    const def = cards.find((c) => c.isDefault) || null;
    setCachedDefaultCard(def, userId);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearCachedCards(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      localStorage.removeItem(`${LOCAL_CACHE_ALL_KEY}_${userId}`);
      localStorage.removeItem(`${LOCAL_CACHE_DEFAULT_KEY}_${userId}`);
      clearUserSalt(userId);
    }
    localStorage.removeItem(LOCAL_CACHE_ALL_KEY);
    localStorage.removeItem(LOCAL_CACHE_DEFAULT_KEY);

    // Clear all user-scoped or legacy card cache keys in localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith('qr_wallet_cards_cache') ||
          k.startsWith('qr_wallet_default_cache') ||
          k.startsWith('qr_wallet_default_card_cache') ||
          k.startsWith('qr_wallet_salt'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}

/**
 * User salt storage for immediate client-side key derivation even before Firebase connects.
 */
export const LOCAL_USER_SALT_KEY = 'qr_wallet_salt';

export function getUserSalt(userId?: string | null): string | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    return localStorage.getItem(`${LOCAL_USER_SALT_KEY}_${userId}`);
  } catch {
    return null;
  }
}

export function setUserSalt(userId: string, salt: string): void {
  if (typeof window === 'undefined' || !userId || !salt) return;
  try {
    localStorage.setItem(`${LOCAL_USER_SALT_KEY}_${userId}`, salt);
  } catch {
    // Ignore storage errors
  }
}

export function clearUserSalt(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.removeItem(`${LOCAL_USER_SALT_KEY}_${userId}`);
  } catch {
    // Ignore storage errors
  }
}

export function getPreviewNumberFormat(): PreviewNumberFormat {
  if (typeof window === 'undefined') return 'last4';
  try {
    const val = localStorage.getItem(PREVIEW_NUMBER_FORMAT_KEY);
    if (val === 'hidden' || val === 'full' || val === 'last4') return val;
    return 'last4';
  } catch {
    return 'last4';
  }
}

export function setPreviewNumberFormat(format: PreviewNumberFormat): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREVIEW_NUMBER_FORMAT_KEY, format);
  } catch {
    // Ignore storage errors
  }
}
