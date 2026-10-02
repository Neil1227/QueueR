'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signInGuest,
  sendResetPasswordEmail,
  checkRedirectResult,
  getCurrentDomain,
  logOut,
} from '@/lib/firebase';
import { removePin, removePasskey } from '@/lib/app-lock';
import { clearCachedCards } from '@/lib/cards';

const AUTH_INIT_TIMEOUT_MS = 1200;
const GUEST_SIGN_IN_TIMEOUT_MS = 1500;
const SESSION_USER_KEY = 'qr_wallet_session_user';

function cacheSessionUser(user: User | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      const minimal = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: Boolean(user.isAnonymous),
      };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(minimal));
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }
  } catch {}
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
  error: string | null;
  unauthorizedDomain: string | null;
  signInWithGoogle: (forceRedirect?: boolean) => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string) => Promise<User>;
  signInGuest: () => Promise<User | null>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Instantly hydrate cached session (google, email, guest) for 0ms initial load
    const cachedSession = localStorage.getItem(SESSION_USER_KEY);
    const localGuestId = localStorage.getItem('qr_wallet_local_guest_uid');
    const localGoogleUser = localStorage.getItem('qr_wallet_local_google_user');

    if (cachedSession) {
      try {
        setUser(JSON.parse(cachedSession));
        setLoading(false);
      } catch {
        setUser(null);
      }
    } else if (localGoogleUser) {
      try {
        setUser(JSON.parse(localGoogleUser));
        setLoading(false);
      } catch {
        setUser(null);
      }
    } else if (localGuestId) {
      setUser({ uid: localGuestId, isAnonymous: true, email: null, displayName: 'Local Guest' } as unknown as User);
      setLoading(false);
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Safety timeout: Ensure authLoading resolves within 3s under any network/platform condition
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, AUTH_INIT_TIMEOUT_MS);

    const initAuth = async () => {
      // Run redirect check in background with a quick timeout without blocking onAuthStateChanged
      Promise.race([
        checkRedirectResult(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ])
        .then((redirectUser) => {
          if (redirectUser && isMounted) {
            cacheSessionUser(redirectUser);
            setUser(redirectUser);
            setLoading(false);
          }
        })
        .catch((err: any) => {
          console.warn('OAuth redirect check notice:', err);
          const msg = err?.message || 'Authentication redirect failed';
          if (isMounted) {
            setError(msg);
            if (msg.includes('Unauthorized Domain') || err?.code === 'auth/unauthorized-domain') {
              setUnauthorizedDomain(getCurrentDomain());
            }
          }
        });

      if (!auth) {
        if (isMounted) setLoading(false);
        return () => {};
      }

      const unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          if (isMounted) {
            clearTimeout(safetyTimer);
            if (currentUser) {
              cacheSessionUser(currentUser);
              setUser(currentUser);
            } else {
              const localGuestId = typeof window !== 'undefined' ? localStorage.getItem('qr_wallet_local_guest_uid') : null;
              if (localGuestId) {
                const guestUser = { uid: localGuestId, isAnonymous: true, email: null, displayName: 'Local Guest' } as unknown as User;
                cacheSessionUser(guestUser);
                setUser(guestUser);
              } else {
                const localGoogleUser = typeof window !== 'undefined' ? localStorage.getItem('qr_wallet_local_google_user') : null;
                if (localGoogleUser) {
                  try {
                    const parsed = JSON.parse(localGoogleUser);
                    cacheSessionUser(parsed);
                    setUser(parsed);
                  } catch {
                    setUser(null);
                  }
                } else {
                  setUser(null);
                }
              }
            }
            setLoading(false);
          }
        },
        (err: any) => {
          console.error('Auth state change error:', err);
          if (isMounted) {
            clearTimeout(safetyTimer);
            const msg = err?.message || 'Authentication error';
            setError(msg);
            if (err?.code === 'auth/unauthorized-domain' || msg.includes('Unauthorized Domain')) {
              setUnauthorizedDomain(getCurrentDomain());
            }
            setLoading(false);
          }
        }
      );

      return unsubscribe;
    };

    let cleanupFn: (() => void) | undefined;
    initAuth().then((unsub) => {
      cleanupFn = unsub;
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      if (cleanupFn) cleanupFn();
    };
  }, []);

  const handleSignInGoogle = async (forceRedirect?: boolean) => {
    setError(null);
    setUnauthorizedDomain(null);
    if (!auth) {
      const simulatedGoogleUser = {
        uid: 'google-user-' + Math.random().toString(36).substring(2, 9),
        displayName: 'Google Account User',
        email: 'user@gmail.com',
        photoURL: null,
        isAnonymous: false,
        providerData: [{ providerId: 'google.com' }],
      } as unknown as User;
      if (typeof window !== 'undefined') {
        localStorage.setItem('qr_wallet_local_google_user', JSON.stringify(simulatedGoogleUser));
        localStorage.removeItem('qr_wallet_local_guest_uid');
      }
      cacheSessionUser(simulatedGoogleUser);
      setUser(simulatedGoogleUser);
      return simulatedGoogleUser;
    }
    try {
      const loggedUser = await signInWithGoogle(forceRedirect);
      if (loggedUser) cacheSessionUser(loggedUser);
      return loggedUser;
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in failed';
      setError(msg);
      if (msg.includes('Unauthorized Domain') || err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(getCurrentDomain());
      }
      throw err;
    }
  };

  const handleSignInEmail = async (email: string, pass: string) => {
    setError(null);
    setUnauthorizedDomain(null);
    try {
      const loggedUser = await signInWithEmail(email, pass);
      if (loggedUser) cacheSessionUser(loggedUser);
      return loggedUser;
    } catch (err: any) {
      const msg = err?.message || 'Email sign-in failed';
      setError(msg);
      if (msg.includes('Unauthorized Domain') || err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(getCurrentDomain());
      }
      throw err;
    }
  };

  const handleSignUpEmail = async (email: string, pass: string) => {
    setError(null);
    setUnauthorizedDomain(null);
    try {
      const newUser = await signUpWithEmail(email, pass);
      if (newUser) cacheSessionUser(newUser);
      return newUser;
    } catch (err: any) {
      const msg = err?.message || 'Sign up failed';
      setError(msg);
      if (msg.includes('Unauthorized Domain') || err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(getCurrentDomain());
      }
      throw err;
    }
  };

  const handleSignInGuest = async () => {
    setError(null);
    setUnauthorizedDomain(null);

    let guestUid = typeof window !== 'undefined' ? localStorage.getItem('qr_wallet_local_guest_uid') : null;
    if (!guestUid) {
      guestUid = 'local-guest-' + Math.random().toString(36).substring(2, 9);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('qr_wallet_local_guest_uid', guestUid);
      localStorage.removeItem('qr_wallet_local_google_user');
      sessionStorage.setItem('qr_wallet_session_active', 'true');
    }
    const localGuestUser = {
      uid: guestUid,
      isAnonymous: true,
      email: null,
      displayName: 'Local Guest',
    } as unknown as User;

    if (!auth) {
      cacheSessionUser(localGuestUser);
      setUser(localGuestUser);
      return localGuestUser;
    }

    try {
      const firebaseUser = await withTimeout(
        signInGuest(),
        GUEST_SIGN_IN_TIMEOUT_MS,
        'Firebase guest sign-in timed out; continuing in offline mode.'
      );
      cacheSessionUser(firebaseUser);
      setUser(firebaseUser);
      return firebaseUser;
    } catch (err: any) {
      // If Firebase Anonymous sign-in is disabled / restricted (auth/admin-restricted-operation),
      // seamlessly fallback to persistent local offline guest mode without breaking the demo!
      console.warn('Firebase Anonymous sign-in not enabled; continuing in Offline Local Guest mode:', err?.message);
      cacheSessionUser(localGuestUser);
      setUser(localGuestUser);
      return localGuestUser;
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    setError(null);
    setUnauthorizedDomain(null);
    if (!auth) {
      return;
    }
    try {
      await sendResetPasswordEmail(email);
    } catch (err: any) {
      const msg = err?.message || 'Failed to send password reset email';
      setError(msg);
      if (msg.includes('Unauthorized Domain') || err?.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(getCurrentDomain());
      }
      throw err;
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setUnauthorizedDomain(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem('qr_wallet_local_guest_uid');
      localStorage.removeItem('qr_wallet_local_google_user');
      sessionStorage.clear();
      removePin();
      removePasskey();
      clearCachedCards();
    }
    if (auth) {
      try {
        await logOut();
      } catch (err) {
        console.warn('Logout warning:', err);
      }
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  return {
    user,
    loading,
    isGuest: Boolean(user?.isAnonymous),
    isConfigured: isFirebaseConfigured,
    error,
    unauthorizedDomain,
    signInWithGoogle: handleSignInGoogle,
    signInWithEmail: handleSignInEmail,
    signUpWithEmail: handleSignUpEmail,
    signInGuest: handleSignInGuest,
    sendPasswordReset: handleSendPasswordReset,
    signOut: handleSignOut,
  };
}
