import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  writeBatch,
  getDoc,
  Firestore,
  query,
  orderBy,
} from 'firebase/firestore';
import { Card, CardSchema, UserMeta, UserMetaSchema } from './schema';
import { setCachedCards, getCachedCards } from './cards';
import {
  getUserStorageKey,
  encryptCardForStorage,
  decryptCardFromStorage,
} from './crypto';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyACicWbUFCC8ncz6t8Ga0eDmDsN1vbwWys',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'queuer-58b67.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'queuer-58b67',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'queuer-58b67.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '13539943246',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:13539943246:web:c4e4f1bb647079cfdff41f',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-BX5Q2TY8L7',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, auth, db };

/**
 * Human-friendly error translation for Firebase Auth error codes.
 */
export function getAuthErrorMessage(err: any): string {
  if (!err) return 'An unknown error occurred. Please try again.';
  const code = err.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in window was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups or use redirect.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few moments or reset your password.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Sign-in method is not enabled in the Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'Current domain is not authorized in Firebase Auth settings.';
    default:
      return err.message || 'Authentication failed. Please try again.';
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-In error:', err);
    if (err?.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
}

export async function handleRedirectResult(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.warn('Redirect auth result check:', err);
    return null;
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  return res.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  await sendPasswordResetEmail(auth, email);
}

export async function signInGuest(): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  const res = await signInAnonymously(auth);
  return res.user;
}

export async function logOut(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Helper to check if current Firebase auth user matches the requested user ID.
 */
export function isAuthUser(userId?: string | null): boolean {
  if (!userId || !auth?.currentUser) return false;
  return auth.currentUser.uid === userId;
}

/**
 * Subscribe to realtime card updates from Firestore for a given user.
 * Falls back to local storage cache if offline, guest, or Firebase is not configured.
 * Automatically syncs local guest cards if user has no cards on remote cloud.
 */
export function subscribeToUserCards(
  userId: string,
  onCards: (cards: Card[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Always emit cached cards first for instant display
  const initialCards = getCachedCards();
  if (initialCards.length > 0) {
    onCards(initialCards);
  }

  // If not connected to a live matching Firebase auth session, operate in offline local mode
  if (!db || !isAuthUser(userId)) {
    return () => {};
  }

  const cardsCol = collection(db, 'users', userId, 'cards');
  const q = query(cardsCol, orderBy('createdAt', 'desc'));

  let hasAttemptedInitialSync = false;

  const unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: true },
    async (snapshot) => {
      try {
        const key = await getUserStorageKey(userId);
        const rawCards: Card[] = [];

        snapshot.forEach((docSnap) => {
          const raw = docSnap.data();
          const parsed = CardSchema.safeParse({ ...raw, id: docSnap.id });
          if (parsed.success) {
            rawCards.push(parsed.data);
          } else {
            console.warn('Card schema validation failed for:', docSnap.id, parsed.error);
          }
        });

        // Decrypt cards from AES-GCM storage format for UI display
        const decryptedCards = await Promise.all(
          rawCards.map((c) => decryptCardFromStorage(c, key))
        );

        // Auto-migrate legacy unencrypted Firestore documents to AES-256 encrypted format
        if (!snapshot.metadata.hasPendingWrites && db) {
          for (const rawCard of rawCards) {
            const isUnencrypted =
              (rawCard.holder && !rawCard.holder.startsWith('enc:v1:')) ||
              (rawCard.number && !rawCard.number.startsWith('enc:v1:')) ||
              (rawCard.payload && !rawCard.payload.startsWith('enc:v1:')) ||
              (rawCard.imgB64 && !rawCard.imgB64.startsWith('enc:v1:'));

            if (isUnencrypted) {
              encryptCardForStorage(rawCard, key)
                .then((encryptedCard) => {
                  const cardRef = doc(db!, 'users', userId, 'cards', rawCard.id);
                  return setDoc(cardRef, cleanForFirestore(encryptedCard), { merge: true });
                })
                .catch((err) => {
                  console.warn('Auto-encrypt migration note:', err);
                });
            }
          }
        }

        // Auto-sync offline guest cards to newly created user cloud account
        if (!hasAttemptedInitialSync && decryptedCards.length === 0 && initialCards.length > 0 && !snapshot.metadata.hasPendingWrites) {
          hasAttemptedInitialSync = true;
          for (const c of initialCards) {
            try {
              await saveUserCard(userId, c);
            } catch (syncErr) {
              console.warn('Failed to sync offline card to cloud:', syncErr);
            }
          }
          return;
        }

        // Update local storage cache
        setCachedCards(decryptedCards);
        onCards(decryptedCards);
      } catch (err: any) {
        console.warn('Failed to process card snapshot:', err);
        const cached = getCachedCards();
        onCards(cached);
      }
    },
    (err) => {
      console.warn('Firestore snapshot notice (using local offline cache):', err?.message);
      // Fallback to local cached cards on permission error
      const cached = getCachedCards();
      onCards(cached);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Strips undefined properties from object to ensure Firestore compatibility.
 */
function cleanForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Save or update a card. Validates client-side with Zod and unsets previous default if needed.
 * Encrypts sensitive fields (holder, number, payload, imgB64) with AES-GCM 256-bit before writing to Firestore.
 * Optimistically updates local cache and persists to Firebase Firestore.
 */
export async function saveUserCard(
  userId: string,
  cardData: Card,
  previousDefaultId?: string | null
): Promise<void> {
  const validated = CardSchema.parse(cardData);

  // Optimistically update local storage cache with decrypted card for instant UI response
  const current = getCachedCards();
  const filtered = current.filter((c) => c.id !== validated.id);
  if (validated.isDefault) {
    filtered.forEach((c) => {
      c.isDefault = false;
    });
  }
  const updated = [validated, ...filtered];
  setCachedCards(updated);

  if (!db || !isAuthUser(userId)) {
    return;
  }

  // Encrypt sensitive card credentials before writing to Cloud Firestore
  const key = await getUserStorageKey(userId);
  const encryptedCard = await encryptCardForStorage(validated, key);
  const cleanData = cleanForFirestore(encryptedCard);
  const cardRef = doc(db, 'users', userId, 'cards', validated.id);

  try {
    // Save the card document directly using setDoc merge
    await setDoc(cardRef, cleanData, { merge: true });

    // If this card is set as default and there was a previous default, unset it safely
    if (validated.isDefault && previousDefaultId && previousDefaultId !== validated.id) {
      try {
        const prevRef = doc(db, 'users', userId, 'cards', previousDefaultId);
        await setDoc(prevRef, { isDefault: false, updatedAt: Date.now() }, { merge: true });
      } catch (prevErr) {
        console.warn('Could not unset previous default in Firestore:', prevErr);
      }
    }
  } catch (err: any) {
    console.error('Firestore saveUserCard error:', err);
    throw new Error(err?.message || 'Failed to save card to Firebase');
  }
}

/**
 * Delete a card by ID.
 */
export async function deleteUserCard(userId: string, cardId: string): Promise<void> {
  const current = getCachedCards();
  const updated = current.filter((c) => c.id !== cardId);
  setCachedCards(updated);

  if (!db || !isAuthUser(userId)) {
    return;
  }

  try {
    const cardRef = doc(db, 'users', userId, 'cards', cardId);
    await deleteDoc(cardRef);
  } catch (err: any) {
    console.error('Firestore deleteUserCard error:', err);
    throw new Error(err?.message || 'Failed to delete card from Firebase');
  }
}

/**
 * Increment useCount and update lastUsedAt timestamp.
 */
export async function recordCardUse(userId: string, cardId: string): Promise<void> {
  const now = Date.now();
  const current = getCachedCards();
  const target = current.find((c) => c.id === cardId);
  if (target) {
    target.useCount = (target.useCount || 0) + 1;
    target.lastUsedAt = now;
    setCachedCards(current);
  }

  if (!db || !isAuthUser(userId)) {
    return;
  }

  try {
    const cardRef = doc(db, 'users', userId, 'cards', cardId);
    await setDoc(
      cardRef,
      {
        useCount: increment(1),
        lastUsedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore recordUse notice:', err);
  }
}

/**
 * Get user metadata (E2EE settings, salt).
 */
export async function getUserMeta(userId: string): Promise<UserMeta | null> {
  if (!db || !isAuthUser(userId)) return null;
  try {
    const metaRef = doc(db, 'users', userId, 'meta', 'settings');
    const snap = await getDoc(metaRef);
    if (!snap.exists()) return null;
    const parsed = UserMetaSchema.safeParse(snap.data());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Save user metadata.
 */
export async function saveUserMeta(userId: string, meta: UserMeta): Promise<void> {
  if (!db || !isAuthUser(userId)) return;
  try {
    const validated = UserMetaSchema.parse(meta);
    const metaRef = doc(db, 'users', userId, 'meta', 'settings');
    const cleanData = cleanForFirestore(validated);
    await setDoc(metaRef, cleanData, { merge: true });
  } catch (err: any) {
    console.error('Firestore saveUserMeta error:', err);
    throw new Error(err?.message || 'Failed to save settings to Firebase');
  }
}


