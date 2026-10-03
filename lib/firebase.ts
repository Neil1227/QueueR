import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
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

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

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
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qr_wallet_auth_redirect_pending');
      if (result?.user) {
        sessionStorage.setItem('qr_wallet_just_redirected', 'true');
      }
    }
    return result?.user ?? null;
  } catch (err: any) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('qr_wallet_auth_redirect_pending');
    }
    throw handleAuthDomainError(err);
  }
}

export type SignInGoogleOptions = { forceRedirect?: boolean; preferPopup?: boolean } | boolean;

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '13539943246-g6fmksvlqjr14vkdafm67e8l2nn4atu9.apps.googleusercontent.com';

export function loadGsiScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).google?.accounts?.oauth2) return resolve(true);

    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve(true);
        } else if (count > 25) {
          clearInterval(interval);
          resolve(false);
        }
      }, 80);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve(true);
        } else if (count > 25) {
          clearInterval(interval);
          resolve(false);
        }
      }, 80);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function signInWithGSI(authInstance: Auth): Promise<User> {
  return new Promise((resolve, reject) => {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services not loaded'));
      }

      let settled = false;

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (response: any) => {
          if (settled) return;
          settled = true;
          if (response.error) {
            if (response.error === 'access_denied') {
              return reject(new Error('Google sign-in popup was closed before completing. Please try again.'));
            }
            return reject(new Error(response.error_description || response.error));
          }
          if (!response.access_token) {
            return reject(new Error('No access token received from Google'));
          }
          try {
            const credential = GoogleAuthProvider.credential(null, response.access_token);
            const result = await signInWithCredential(authInstance, credential);
            resolve(result.user);
          } catch (err: any) {
            reject(handleAuthDomainError(err));
          }
        },
        error_callback: (err: any) => {
          if (settled) return;
          settled = true;
          if (err?.type === 'popup_closed') {
            return reject(new Error('Google sign-in popup was closed before completing. Please try again.'));
          }
          if (err?.type === 'popup_failed_to_open') {
            return reject(new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.'));
          }
          reject(new Error(err?.message || err?.type || 'Google OAuth failed'));
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
}

export async function signInWithGoogle(options?: SignInGoogleOptions): Promise<User | null> {
  if (!auth) throw new Error('Firebase Auth is not configured');

  // Handle boolean backwards-compatibility for existing callers: signInWithGoogle(forceRedirect)
  const forceRedirect = typeof options === 'boolean' ? options : options?.forceRedirect ?? false;
  const preferPopup = typeof options === 'object' ? options?.preferPopup ?? false : false;

  // 1. Primary Modern Flow: Google Identity Services (GSI)
  // GSI communicates directly with Google's OAuth services and exchanges tokens via direct HTTPS call (signInWithCredential).
  // This bypasses Chrome third-party storage partitioning (CHIPS), Safari ITP, and COOP cross-origin opener severing.
  if (!forceRedirect && typeof window !== 'undefined') {
    const isGsiAvailable = (window as any).google?.accounts?.oauth2 || await loadGsiScript();
    if (isGsiAvailable) {
      try {
        const user = await signInWithGSI(auth);
        if (user) return user;
      } catch (gsiErr: any) {
        console.warn('GSI auth notice:', gsiErr);
        const msg = gsiErr?.message || '';
        if (msg.includes('closed') || gsiErr?.code === 'auth/popup-closed-by-user') {
          throw new Error('Google sign-in popup was closed before completing. Please try again.');
        }
        // If GSI experienced an error other than user closing, continue to fallback flows
      }
    }
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // 2. Fallback Flow: If caller requested redirect or in environments where redirect works (e.g. Edge)
  if (forceRedirect) {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('qr_wallet_auth_redirect_pending', 'true');
      }
      await signInWithRedirect(auth, provider);
      return null;
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('qr_wallet_auth_redirect_pending');
      }
      throw handleAuthDomainError(err);
    }
  }

  // 3. Fallback: Firebase popup with timeout race
  const POPUP_TIMEOUT_MS = 6000;
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const err: any = new Error('Google popup communication timed out (COOP/context isolation). Falling back to full-page redirect.');
      err.code = 'auth/popup-timeout';
      reject(err);
    }, POPUP_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      signInWithPopup(auth, provider),
      timeoutPromise,
    ]);
    clearTimeout(timeoutId);
    return result.user;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const processed = handleAuthDomainError(err);
    if (processed !== err) throw processed;

    // If popup timed out, was blocked, was cancelled, or is unsupported, seamlessly fall back to full-page redirect
    if (
      err?.code === 'auth/popup-timeout' ||
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      console.warn('Popup issue detected (' + err?.code + '), seamlessly falling back to full-page redirect...');
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('qr_wallet_auth_redirect_pending', 'true');
        }
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr: any) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('qr_wallet_auth_redirect_pending');
        }
        throw handleAuthDomainError(redirectErr);
      }
    }

    if (err?.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completing. Please try again.');
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


export async function logOut(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export function isLocalOfflineUser(userId?: string | null): boolean {
  if (!userId) return true;
  return (
    userId.startsWith('local-guest-') ||
    userId.startsWith('google-user-') ||
    userId.startsWith('local-')
  );
}

/**
 * Subscribe to realtime card updates from Firestore for a given user.
 * Falls back to local storage cache if offline or Firebase is not configured.
 */
export function subscribeToUserCards(
  userId: string,
  onCards: (cards: Card[], fromCache?: boolean) => void,
  onError?: (err: Error) => void
): () => void {
  // Always emit cached cards first for instant display if available
  const initialCards = getCachedCards(userId);
  if (initialCards.length > 0) {
    onCards(initialCards);
  }

  if (!db || isLocalOfflineUser(userId)) {
    if (initialCards.length === 0) {
      onCards([]);
    }
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
      setCachedCards(cards, userId);
      onCards(cards, snapshot.metadata.fromCache);
    },
    (err) => {
      console.warn('Firestore snapshot error:', err);
      // On error, still emit whatever cached cards we have so UI doesn't hang in skeleton state
      onCards(initialCards);
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

  if (!db || isLocalOfflineUser(userId)) {
    // Local offline storage fallback
    const current = getCachedCards(userId);
    const filtered = current.filter((c) => c.id !== validated.id);
    if (validated.isDefault) {
      filtered.forEach((c) => {
        c.isDefault = false;
      });
    }
    const updated = [validated, ...filtered];
    setCachedCards(updated, userId);
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
  if (!db || isLocalOfflineUser(userId)) {
    const current = getCachedCards(userId);
    const updated = current.filter((c) => c.id !== cardId);
    setCachedCards(updated, userId);
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
  if (!db || isLocalOfflineUser(userId)) {
    const current = getCachedCards(userId);
    const target = current.find((c) => c.id === cardId);
    if (target) {
      target.useCount = (target.useCount || 0) + 1;
      target.lastUsedAt = now;
      setCachedCards(current, userId);
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
  if (!db || isLocalOfflineUser(userId)) return null;
  try {
    const metaRef = doc(db, 'users', userId, 'meta', 'settings');
    const snap = await Promise.race([
      getDoc(metaRef),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]);
    if (!snap || !snap.exists()) return null;
    const parsed = UserMetaSchema.safeParse(snap.data());
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.warn('getUserMeta notice:', err);
    return null;
  }
}

/**
 * Save user metadata.
 */
export async function saveUserMeta(userId: string, meta: UserMeta): Promise<void> {
  if (!db || isLocalOfflineUser(userId)) return;
  const validated = UserMetaSchema.parse(meta);
  const metaRef = doc(db, 'users', userId, 'meta', 'settings');
  await setDoc(metaRef, cleanFirestoreData(validated), { merge: true });
}

/**
 * Save user 4-digit security PIN hash and salt to cloud metadata.
 */
export async function saveUserPin(userId: string, pinHash: string, pinSalt: string): Promise<void> {
  if (!db || isLocalOfflineUser(userId)) return;
  const metaRef = doc(db, 'users', userId, 'meta', 'settings');
  await setDoc(metaRef, { pinHash, pinSalt, updatedAt: Date.now() }, { merge: true });
}
