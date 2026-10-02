import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  User,
  Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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

    try {
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence).catch((e) => {
        console.warn('Firebase persistence warning:', e);
      });
    } catch (authErr) {
      console.warn('Auth initialization fallback:', authErr);
      auth = null;
    }

    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      try {
        db = getFirestore(app);
      } catch (dbErr) {
        console.warn('Firestore initialization fallback:', dbErr);
        db = null;
      }
    }

    // Optional Analytics (Client-side dynamic load)
    if (firebaseConfig.measurementId) {
      import('firebase/analytics')
        .then(({ getAnalytics, isSupported }) => {
          isSupported().then((supported) => {
            if (supported && app) {
              getAnalytics(app);
            }
          });
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, auth, db };

export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua) ||
    (window.navigator.maxTouchPoints > 1 && window.innerWidth < 800)
  );
}

export function getCurrentDomain(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
}

function handleAuthDomainError(err: any): Error {
  if (err?.code === 'auth/unauthorized-domain') {
    const domain = getCurrentDomain();
    return new Error(
      `Unauthorized Domain: "${domain}" is not added in your Firebase Console. Go to Firebase Console > Authentication > Settings > Authorized domains > Add "${domain}".`
    );
  }
  return err;
}

export async function checkRedirectResult(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (err: any) {
    throw handleAuthDomainError(err);
  }
}

export async function signInWithGoogle(forceRedirect = false): Promise<User | null> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const shouldRedirect = forceRedirect || isMobileBrowser();

  if (shouldRedirect) {
    try {
      await signInWithRedirect(auth, provider);
      return null;
    } catch (err: any) {
      throw handleAuthDomainError(err);
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    const processed = handleAuthDomainError(err);
    if (processed !== err) throw processed;

    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr: any) {
        throw handleAuthDomainError(redirectErr);
      }
    }
    throw err;
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err: any) {
    throw handleAuthDomainError(err);
  }
}

export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err: any) {
    throw handleAuthDomainError(err);
  }
}

export async function signInGuest(): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  try {
    const res = await signInAnonymously(auth);
    return res.user;
  } catch (err: any) {
    throw handleAuthDomainError(err);
  }
}

export async function sendResetPasswordEmail(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not configured');
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err: any) {
    throw handleAuthDomainError(err);
  }
}

export async function logOut(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Subscribe to realtime card updates from Firestore for a given user.
 * Falls back to local storage cache if offline or Firebase is not configured.
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

  if (!db || !userId) {
    return () => {};
  }

  const cardsCol = collection(db, 'users', userId, 'cards');
  const q = query(cardsCol, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const cards: Card[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        const parsed = CardSchema.safeParse({ ...raw, id: docSnap.id });
        if (parsed.success) {
          cards.push(parsed.data);
        } else {
          console.warn('Card schema validation failed for:', docSnap.id, parsed.error);
        }
      });

      // Update local storage cache
      setCachedCards(cards);
      onCards(cards);
    },
    (err) => {
      console.warn('Firestore snapshot error:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save or update a card. Validates client-side with Zod and unsets previous default if needed.
 */
function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export async function saveUserCard(
  userId: string,
  cardData: Card,
  previousDefaultId?: string | null
): Promise<void> {
  const validated = CardSchema.parse(cardData);

  if (!db || !userId) {
    // Local offline storage fallback
    const current = getCachedCards();
    const filtered = current.filter((c) => c.id !== validated.id);
    if (validated.isDefault) {
      filtered.forEach((c) => {
        c.isDefault = false;
      });
    }
    const updated = [validated, ...filtered];
    setCachedCards(updated);
    return;
  }

  const batch = writeBatch(db);
  const cardRef = doc(db, 'users', userId, 'cards', validated.id);

  if (validated.isDefault && previousDefaultId && previousDefaultId !== validated.id) {
    const prevRef = doc(db, 'users', userId, 'cards', previousDefaultId);
    batch.update(prevRef, { isDefault: false, updatedAt: Date.now() });
  }

  batch.set(cardRef, cleanFirestoreData(validated), { merge: true });
  await batch.commit();
}

/**
 * Delete a card by ID.
 */
export async function deleteUserCard(userId: string, cardId: string): Promise<void> {
  if (!db || !userId) {
    const current = getCachedCards();
    const updated = current.filter((c) => c.id !== cardId);
    setCachedCards(updated);
    return;
  }

  const cardRef = doc(db, 'users', userId, 'cards', cardId);
  await deleteDoc(cardRef);
}

/**
 * Increment useCount and update lastUsedAt timestamp.
 */
export async function recordCardUse(userId: string, cardId: string): Promise<void> {
  const now = Date.now();
  if (!db || !userId) {
    const current = getCachedCards();
    const target = current.find((c) => c.id === cardId);
    if (target) {
      target.useCount = (target.useCount || 0) + 1;
      target.lastUsedAt = now;
      setCachedCards(current);
    }
    return;
  }

  const cardRef = doc(db, 'users', userId, 'cards', cardId);
  await updateDoc(cardRef, {
    useCount: increment(1),
    lastUsedAt: now,
  });
}

/**
 * Get user metadata (E2EE settings, salt).
 */
export async function getUserMeta(userId: string): Promise<UserMeta | null> {
  if (!db || !userId) return null;
  const metaRef = doc(db, 'users', userId, 'meta', 'settings');
  const snap = await getDoc(metaRef);
  if (!snap.exists()) return null;
  const parsed = UserMetaSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : null;
}

/**
 * Save user metadata.
 */
export async function saveUserMeta(userId: string, meta: UserMeta): Promise<void> {
  if (!db || !userId) return;
  const validated = UserMetaSchema.parse(meta);
  const metaRef = doc(db, 'users', userId, 'meta', 'settings');
  await setDoc(metaRef, cleanFirestoreData(validated), { merge: true });
}
