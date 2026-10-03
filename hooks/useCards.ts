'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  getUserSalt,
  setUserSalt,
} from '@/lib/cards';
import { deriveKey, deriveUserKey, encryptCardForStorage, decryptCardFromStorage, generateSalt } from '@/lib/crypto';

const CARD_LOAD_TIMEOUT_MS = 2500;

export function useCards(userId?: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const cardsRef = useRef<Card[]>(cards);
  cardsRef.current = cards;

  const [loading, setLoading] = useState(true);
  const [e2eeKey, setE2eeKey] = useState<CryptoKey | null>(null);
  const e2eeKeyRef = useRef<CryptoKey | null>(e2eeKey);
  e2eeKeyRef.current = e2eeKey;

  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Helper to derive and set encryption key given userId and salt
  const initKeyForUser = useCallback(async (uid: string, salt: string): Promise<CryptoKey | null> => {
    try {
      const savedPassphrase = typeof window !== 'undefined'
        ? sessionStorage.getItem('qr_wallet_e2ee_passphrase') || undefined
        : undefined;
      const key = await deriveUserKey(uid, salt, savedPassphrase);
      setE2eeKey(key);
      e2eeKeyRef.current = key;
      return key;
    } catch (err) {
      console.warn('Error deriving user key:', err);
      return null;
    }
  }, []);

  // Initialize or derive encryption key automatically for user
  useEffect(() => {
    if (!userId) {
      setE2eeKey(null);
      e2eeKeyRef.current = null;
      return;
    }

    let isMounted = true;
    (async () => {
      // 1. Immediately check cached salt from localStorage for instant, synchronous-speed key derivation
      const cachedSalt = getUserSalt(userId);
      let activeSalt = cachedSalt;
      if (cachedSalt) {
        await initKeyForUser(userId, cachedSalt);
      }

      // 2. Query Firestore user meta to sync or initialize
      try {
        let meta = await getUserMeta(userId);
        if (!isMounted) return;

        if (meta?.salt) {
          if (meta.salt !== activeSalt) {
            setUserSalt(userId, meta.salt);
            activeSalt = meta.salt;
            await initKeyForUser(userId, meta.salt);
          }
          setUserMeta(meta);
        } else if (!activeSalt) {
          // Brand new user: neither local nor remote has a salt
          const newSalt = generateSalt();
          setUserSalt(userId, newSalt);
          activeSalt = newSalt;
          const newMeta: UserMeta = { e2eeEnabled: true, salt: newSalt, updatedAt: Date.now() };
          await saveUserMeta(userId, newMeta);
          if (isMounted) {
            setUserMeta(newMeta);
            await initKeyForUser(userId, newSalt);
          }
        } else {
          // Local salt exists, sync it to Firestore
          const newMeta: UserMeta = { e2eeEnabled: true, salt: activeSalt, updatedAt: Date.now() };
          await saveUserMeta(userId, newMeta);
          if (isMounted) setUserMeta(newMeta);
        }
      } catch (err) {
        console.warn('User encryption key notice:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, initKeyForUser]);

  // Subscribe to cards from Firestore & load local cache
  useEffect(() => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }

    const cached = getCachedCards(userId);
    if (cached.length > 0) {
      setCards(sortCards(cached));
      setLoading(false);
    } else {
      setCards([]);
      setLoading(true);
    }

    // Safety timeout: Ensure loading finishes within 2.5s even if Firestore is slow or offline
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, CARD_LOAD_TIMEOUT_MS);
    let isCurrentSubscription = true;

    const unsubscribe = subscribeToUserCards(
      userId,
      async (newCards, fromCache = false) => {
        if (!isCurrentSubscription) return;
        if (newCards.length > 0 || !fromCache) {
          clearTimeout(safetyTimer);
        }

        // If we don't have encryption key yet in ref, attempt quick derivation from local salt
        let currentKey = e2eeKeyRef.current;
        if (!currentKey && userId) {
          const localSalt = getUserSalt(userId);
          if (localSalt) {
            currentKey = await initKeyForUser(userId, localSalt);
          }
        }

        let processedCards = newCards;
        if (currentKey) {
          processedCards = await Promise.all(
            newCards.map(async (c) => {
              try {
                return await decryptCardFromStorage(c, currentKey!);
              } catch {
                return c;
              }
            })
          );
        }

        // Merge with existing decrypted data to prevent blank fields from stomping decrypted cards
        const currentCards = cardsRef.current;
        const localCached = getCachedCards(userId);
        processedCards = processedCards.map((c) => {
          const existing =
            currentCards.find((ec) => ec.id === c.id) ||
            localCached.find((lc) => lc.id === c.id);
          if (!existing) return c;
          return {
            ...c,
            holder: c.holder || existing.holder || '',
            number: c.number || existing.number || '',
            payload: c.payload || existing.payload || null,
            imgB64: c.imgB64 || existing.imgB64 || null,
          };
        });

        if (!isCurrentSubscription) return;
        const sorted = sortCards(processedCards);
        setCards(sorted);
        setCachedCards(sorted, userId);
        if (sorted.length > 0 || !fromCache) {
          setLoading(false);
        }
      },
      () => {
        if (!isCurrentSubscription) return;
        clearTimeout(safetyTimer);
        setLoading(false);
      }
    );

    return () => {
      isCurrentSubscription = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [userId, initKeyForUser]);

  // Reactive decryption when e2eeKey is derived without resetting loading state
  useEffect(() => {
    if (!e2eeKey || cards.length === 0) return;
    const hasUndecryptedFields = cards.some(
      (card) =>
        (card.holderEnc && !card.holder) ||
        (card.numberEnc && !card.number) ||
        (card.payloadEnc && !card.payload)
    );
    if (!hasUndecryptedFields) return;

    let isMounted = true;
    (async () => {
      const decrypted = await Promise.all(
        cards.map(async (c) => {
          try {
            return await decryptCardFromStorage(c, e2eeKey);
          } catch {
            return c;
          }
        })
      );
      const changed = decrypted.some(
        (card, index) =>
          card.holder !== cards[index]?.holder ||
          card.number !== cards[index]?.number ||
          card.payload !== cards[index]?.payload
      );
      if (isMounted && changed) {
        const sorted = sortCards(decrypted);
        setCards(sorted);
        setCachedCards(sorted, userId);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [e2eeKey, cards, userId]);

  // App resume/foreground listener: re-check decryption on visibility change or window focus
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;

    const handleResume = async () => {
      if (document.visibilityState === 'visible') {
        const currentCards = cardsRef.current;
        const hasUndecrypted = currentCards.some(
          (c) =>
            (c.holderEnc && !c.holder) ||
            (c.numberEnc && !c.number) ||
            (c.payloadEnc && !c.payload)
        );

        if (hasUndecrypted) {
          let key = e2eeKeyRef.current;
          if (!key) {
            const salt = getUserSalt(userId) || userMeta?.salt;
            if (salt) {
              key = await initKeyForUser(userId, salt);
            }
          }
          if (key) {
            const decrypted = await Promise.all(
              currentCards.map(async (c) => {
                try {
                  return await decryptCardFromStorage(c, key!);
                } catch {
                  return c;
                }
              })
            );
            const sorted = sortCards(decrypted);
            setCards(sorted);
            setCachedCards(sorted, userId);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [userId, userMeta, initKeyForUser]);

  // Pull-to-refresh or manual card refresh handler
  const refreshCards = useCallback(async () => {
    if (!userId) return;
    try {
      let key = e2eeKeyRef.current;
      if (!key) {
        const salt = getUserSalt(userId);
        if (salt) {
          key = await initKeyForUser(userId, salt);
        }
      }
      const meta = await getUserMeta(userId);
      if (meta?.salt) {
        setUserMeta(meta);
        setUserSalt(userId, meta.salt);
        if (!key || meta.salt !== getUserSalt(userId)) {
          key = await initKeyForUser(userId, meta.salt);
        }
      }

      // Re-decrypt any cards currently loaded
      const current = cardsRef.current;
      if (key && current.length > 0) {
        const decrypted = await Promise.all(
          current.map(async (c) => {
            try {
              return await decryptCardFromStorage(c, key!);
            } catch {
              return c;
            }
          })
        );
        const sorted = sortCards(decrypted);
        setCards(sorted);
        setCachedCards(sorted, userId);
      }
    } catch (err) {
      console.warn('Refresh cards notice:', err);
    }
  }, [userId, initKeyForUser]);

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
        let salt = meta?.salt || getUserSalt(userId);
        if (!salt) {
          salt = generateSalt();
          setUserSalt(userId, salt);
          const newMeta: UserMeta = { e2eeEnabled: true, salt, updatedAt: Date.now() };
          await saveUserMeta(userId, newMeta);
          setUserMeta(newMeta);
        }

        const key = await deriveUserKey(userId, salt, passphrase);
        setE2eeKey(key);
        e2eeKeyRef.current = key;
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
        setCachedCards(sorted, userId);
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
    const salt = userMeta?.salt || (userId ? getUserSalt(userId) : null);
    if (userId && salt) {
      const defaultKey = await deriveUserKey(userId, salt);
      setE2eeKey(defaultKey);
      e2eeKeyRef.current = defaultKey;
    } else {
      setE2eeKey(null);
      e2eeKeyRef.current = null;
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
      setCachedCards(updatedList, userId);

      if (userId) {
        // Automatically encrypt before saving to Firestore
        let activeKey = e2eeKeyRef.current;
        if (!activeKey) {
          const salt = getUserSalt(userId) || userMeta?.salt;
          if (salt) {
            activeKey = await deriveUserKey(userId, salt);
          }
        }
        const cardToSave = activeKey ? await encryptCardForStorage(plainCard, activeKey) : plainCard;
        await saveUserCard(userId, cardToSave, previousDefault);
      }
    },
    [cards, userId, userMeta]
  );

  // Delete card
  const deleteCard = useCallback(
    async (cardId: string) => {
      const updated = cards.filter((c) => c.id !== cardId);
      setCards(sortCards(updated));
      setCachedCards(updated, userId);

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
      setCachedCards(updated, userId);

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
      setCachedCards(sorted, userId);

      if (userId) {
        let activeKey = e2eeKeyRef.current;
        if (!activeKey) {
          const salt = getUserSalt(userId) || userMeta?.salt;
          if (salt) {
            activeKey = await deriveUserKey(userId, salt);
          }
        }
        for (const c of targetCards) {
          const cardToSave = activeKey ? await encryptCardForStorage(c, activeKey) : c;
          await saveUserCard(userId, cardToSave);
        }
      }
    },
    [cards, userId, userMeta]
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
    refreshCards,
  };
}
