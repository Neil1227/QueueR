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
import { deriveKey, deriveUserKey, encryptCardForStorage, decryptCardFromStorage, generateSalt } from '@/lib/crypto';

export function useCards(userId?: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [e2eeKey, setE2eeKey] = useState<CryptoKey | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Initialize or derive encryption key automatically for user
  useEffect(() => {
    if (!userId) {
      setE2eeKey(null);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        let meta = await getUserMeta(userId);
        let salt = meta?.salt;
        if (!salt) {
          salt = generateSalt();
          meta = { e2eeEnabled: true, salt, updatedAt: Date.now() };
          await saveUserMeta(userId, meta);
        }
        if (isMounted) setUserMeta(meta);

        const savedPassphrase = typeof window !== 'undefined'
          ? sessionStorage.getItem('qr_wallet_e2ee_passphrase') || undefined
          : undefined;

        const key = await deriveUserKey(userId, salt, savedPassphrase);
        if (isMounted) {
          setE2eeKey(key);
        }
      } catch (err) {
        console.error('Failed to derive user encryption key:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

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

    const unsubscribe = subscribeToUserCards(
      userId,
      async (newCards) => {
        let processedCards = newCards;

        // If we have encryption key, decrypt cards
        if (e2eeKey) {
          processedCards = await Promise.all(
            newCards.map(async (c) => {
              try {
                return await decryptCardFromStorage(c, e2eeKey);
              } catch {
                return c;
              }
            })
          );
        }

        const sorted = sortCards(processedCards);
        setCards(sorted);
        setCachedCards(sorted);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, e2eeKey]);

  // Unlock E2EE with custom passphrase
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

        const key = await deriveUserKey(userId, salt, passphrase);
        setE2eeKey(key);
        if (typeof window !== 'undefined') {
          if (passphrase) {
            sessionStorage.setItem('qr_wallet_e2ee_passphrase', passphrase);
          } else {
            sessionStorage.removeItem('qr_wallet_e2ee_passphrase');
          }
        }

        // Decrypt currently loaded cards
        const decryptedList = await Promise.all(
          cards.map(async (c) => {
            try {
              return await decryptCardFromStorage(c, key);
            } catch {
              return c;
            }
          })
        );

        const sorted = sortCards(decryptedList);
        setCards(sorted);
        setCachedCards(sorted);
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

  // Lock E2EE (reset to default user key)
  const lockE2EE = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qr_wallet_e2ee_passphrase');
    }
    if (userId && userMeta?.salt) {
      const defaultKey = await deriveUserKey(userId, userMeta.salt);
      setE2eeKey(defaultKey);
    } else {
      setE2eeKey(null);
    }
  }, [userId, userMeta]);

  // Save or update card (encrypts sensitive fields before sending to Firestore)
  const saveCard = useCallback(
    async (input: CardInput) => {
      const now = Date.now();
      const currentCards = cards;
      const existing = input.id ? currentCards.find((c) => c.id === input.id) : null;
      const cardId = input.id || crypto.randomUUID();

      const plainCard: Card = {
        id: cardId,
        provider: input.provider.trim(),
        color: input.color,
        holder: input.holder.trim(),
        number: input.number.trim(),
        label: input.label.trim(),
        category: input.category || 'personal',
        payload: input.payload || null,
        imgB64: input.imgB64 || null,
        logoB64: input.logoB64 || null,
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

      const updatedList = [
        plainCard,
        ...currentCards.filter((c) => c.id !== cardId).map((c) => {
          if (input.isDefault && c.isDefault) {
            return { ...c, isDefault: false };
          }
          return c;
        }),
      ];

      setCards(sortCards(updatedList));
      setCachedCards(updatedList);

      if (userId) {
        // Automatically encrypt before saving to Firestore
        const activeKey = e2eeKey || (userMeta?.salt ? await deriveUserKey(userId, userMeta.salt) : null);
        const cardToSave = activeKey ? await encryptCardForStorage(plainCard, activeKey) : plainCard;
        await saveUserCard(userId, cardToSave, previousDefault);
      }
    },
    [cards, e2eeKey, userId, userMeta]
  );

  // Delete card
  const deleteCard = useCallback(
    async (cardId: string) => {
      const updated = cards.filter((c) => c.id !== cardId);
      setCards(sortCards(updated));
      setCachedCards(updated);

      if (userId) {
        await deleteUserCard(userId, cardId);
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
      setCachedCards(updated);

      if (userId) {
        await recordCardUse(userId, cardId);
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
      setCachedCards(sorted);

      if (userId) {
        const activeKey = e2eeKey || (userMeta?.salt ? await deriveUserKey(userId, userMeta.salt) : null);
        for (const c of targetCards) {
          const cardToSave = activeKey ? await encryptCardForStorage(c, activeKey) : c;
          await saveUserCard(userId, cardToSave);
        }
      }
    },
    [cards, userId, e2eeKey, userMeta]
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
    isE2EEConfigured: true,
    isDecrypting,
    unlockE2EE,
    lockE2EE,
  };
}
