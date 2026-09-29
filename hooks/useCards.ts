'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardInput, UserMeta } from '@/lib/schema';
import {
  subscribeToUserCards,
  saveUserCard,
  deleteUserCard,
  recordCardUse,
  getUserMeta,
  saveUserMeta,
} from '@/lib/firebase';
import {
  sortCards,
  getCachedCards,
  setCachedCards,
  getCachedDefaultCard,
} from '@/lib/cards';
import { deriveKey, encryptText, decryptText, generateSalt } from '@/lib/crypto';

export function useCards(userId?: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [e2eeKey, setE2eeKey] = useState<CryptoKey | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Subscribe to cards from Firestore & load local cache
  useEffect(() => {
    const cached = getCachedCards();
    if (cached.length > 0) {
      setCards(sortCards(cached));
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch user meta for E2EE
    getUserMeta(userId).then((meta) => {
      if (meta) setUserMeta(meta);
    });

    const unsubscribe = subscribeToUserCards(
      userId,
      async (newCards) => {
        let processedCards = newCards;

        // If E2EE is active and we have key, attempt decryption
        if (e2eeKey) {
          processedCards = await Promise.all(
            newCards.map(async (c) => {
              try {
                const decNum = c.numberEnc ? await decryptText(c.numberEnc, e2eeKey) : c.number;
                const decPayload = c.payloadEnc ? await decryptText(c.payloadEnc, e2eeKey) : c.payload;
                return { ...c, number: decNum, payload: decPayload };
              } catch {
                return c;
              }
            })
          );
        }

        const sorted = sortCards(processedCards);
        setCards(sorted);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, e2eeKey]);

  // Unlock E2EE with passphrase
  const unlockE2EE = useCallback(
    async (passphrase: string): Promise<boolean> => {
      if (!userId) return false;
      setIsDecrypting(true);
      try {
        let meta = userMeta;
        if (!meta) {
          meta = await getUserMeta(userId);
        }
        let salt = meta?.salt;
        if (!salt) {
          salt = generateSalt();
          const newMeta: UserMeta = { e2eeEnabled: true, salt, updatedAt: Date.now() };
          await saveUserMeta(userId, newMeta);
          setUserMeta(newMeta);
        }

        const key = await deriveKey(passphrase, salt);
        setE2eeKey(key);

        // Decrypt currently loaded cards
        const decryptedList = await Promise.all(
          cards.map(async (c) => {
            try {
              const decNum = c.numberEnc ? await decryptText(c.numberEnc, key) : c.number;
              const decPayload = c.payloadEnc ? await decryptText(c.payloadEnc, key) : c.payload;
              return { ...c, number: decNum, payload: decPayload };
            } catch {
              return c;
            }
          })
        );

        setCards(sortCards(decryptedList));
        setIsDecrypting(false);
        return true;
      } catch (err) {
        console.error('Failed to unlock E2EE:', err);
        setIsDecrypting(false);
        return false;
      }
    },
    [userId, userMeta, cards]
  );

  // Lock E2EE (clear key)
  const lockE2EE = useCallback(() => {
    setE2eeKey(null);
  }, []);

  // Save or update card
  const saveCard = useCallback(
    async (input: CardInput) => {
      const now = Date.now();
      const currentCards = cards;
      const existing = input.id ? currentCards.find((c) => c.id === input.id) : null;
      const cardId = input.id || crypto.randomUUID();

      let number = input.number.trim();
      let numberEnc: string | undefined = undefined;
      let payload = input.payload || null;
      let payloadEnc: string | null | undefined = undefined;

      if (e2eeKey) {
        if (number) {
          numberEnc = await encryptText(number, e2eeKey);
          number = ''; // Do not store plaintext when E2EE is enabled
        }
        if (payload) {
          payloadEnc = await encryptText(payload, e2eeKey);
          payload = null;
        }
      }

      const card: Card = {
        id: cardId,
        provider: input.provider.trim(),
        color: input.color,
        holder: input.holder.trim(),
        number: numberEnc ? '' : number,
        numberEnc,
        label: input.label.trim(),
        payload: payloadEnc ? null : payload,
        payloadEnc,
        imgB64: input.imgB64 || null,
        isDefault: input.isDefault,
        useCount: existing?.useCount || 0,
        lastUsedAt: existing?.lastUsedAt || 0,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        v: 1,
      };

      const previousDefault = input.isDefault
        ? currentCards.find((c) => c.isDefault && c.id !== cardId)?.id || null
        : null;

      // Optimistic update
      const plainCardForUI = {
        ...card,
        number: input.number.trim(),
        payload: input.payload || null,
      };

      const updatedList = [
        plainCardForUI,
        ...currentCards.filter((c) => c.id !== cardId).map((c) => {
          if (input.isDefault && c.isDefault) {
            return { ...c, isDefault: false };
          }
          return c;
        }),
      ];

      setCards(sortCards(updatedList));

      if (userId) {
        await saveUserCard(userId, card, previousDefault);
      } else {
        setCachedCards(updatedList);
      }
    },
    [cards, e2eeKey, userId]
  );

  // Delete card
  const deleteCard = useCallback(
    async (cardId: string) => {
      const updated = cards.filter((c) => c.id !== cardId);
      setCards(sortCards(updated));

      if (userId) {
        await deleteUserCard(userId, cardId);
      } else {
        setCachedCards(updated);
      }
    },
    [cards, userId]
  );

  // Increment usage count and update lastUsedAt
  const recordUse = useCallback(
    async (cardId: string) => {
      const now = Date.now();
      const target = cards.find((c) => c.id === cardId);
      if (!target) return;

      const updated = cards.map((c) =>
        c.id === cardId ? { ...c, useCount: (c.useCount || 0) + 1, lastUsedAt: now } : c
      );
      setCards(sortCards(updated));

      if (userId) {
        await recordCardUse(userId, cardId);
      } else {
        setCachedCards(updated);
      }
    },
    [cards, userId]
  );

  // Bulk import cards from backup (merge or replace)
  const importCards = useCallback(
    async (importedList: Card[], mode: 'merge' | 'replace') => {
      const current = cards;
      let targetCards: Card[];

      if (mode === 'replace') {
        targetCards = importedList;
      } else {
        const { merged } = await import('@/lib/backup').then((m) => m.mergeCards(current, importedList));
        targetCards = merged;
      }

      const sorted = sortCards(targetCards);
      setCards(sorted);

      if (userId) {
        // Save each card to Firestore
        for (const c of targetCards) {
          await saveUserCard(userId, c);
        }
      } else {
        setCachedCards(sorted);
      }
    },
    [cards, userId]
  );

  return {
    cards,
    loading,
    defaultCard: cards.find((c) => c.isDefault) || cards[0] || null,
    saveCard,
    deleteCard,
    recordUse,
    importCards,
    isE2EEActive: Boolean(e2eeKey),
    isE2EEConfigured: Boolean(userMeta?.e2eeEnabled),
    isDecrypting,
    unlockE2EE,
    lockE2EE,
  };
}
