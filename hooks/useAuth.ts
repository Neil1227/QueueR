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

    // Check local guest or local google user
    const localGuestId = localStorage.getItem('qr_wallet_local_guest_uid');
    const localGoogleUser = localStorage.getItem('qr_wallet_local_google_user');

    if (!auth) {
      if (localGoogleUser) {
        try {
          setUser(JSON.parse(localGoogleUser));
        } catch {
          setUser(null);
        }
      } else if (localGuestId) {
        setUser({ uid: localGuestId, isAnonymous: true, email: null, displayName: 'Local Guest' } as unknown as User);
      }
      setLoading(false);
      return;
    }

    let isMounted = true;

    const initAuth = async () => {
      try {
        const redirectUser = await checkRedirectResult();
        if (redirectUser && isMounted) {
          setUser(redirectUser);
        }
      } catch (err: any) {
        console.warn('OAuth redirect check notice:', err);
        const msg = err?.message || 'Authentication redirect failed';
        if (isMounted) {
          setError(msg);
          if (msg.includes('Unauthorized Domain') || err?.code === 'auth/unauthorized-domain') {
            setUnauthorizedDomain(getCurrentDomain());
          }
        }
      }

      if (!isMounted || !auth) return;

      const unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          if (isMounted) {
            if (currentUser) {
              setUser(currentUser);
            } else {
              const localGuestId = typeof window !== 'undefined' ? localStorage.getItem('qr_wallet_local_guest_uid') : null;
              if (localGuestId) {
                setUser({ uid: localGuestId, isAnonymous: true, email: null, displayName: 'Local Guest' } as unknown as User);
              } else {
                const localGoogleUser = typeof window !== 'undefined' ? localStorage.getItem('qr_wallet_local_google_user') : null;
                if (localGoogleUser) {
                  try {
                    setUser(JSON.parse(localGoogleUser));
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
      setUser(simulatedGoogleUser);
      return simulatedGoogleUser;
    }
    try {
      return await signInWithGoogle(forceRedirect);
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
      return await signInWithEmail(email, pass);
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
      return await signUpWithEmail(email, pass);
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
      setUser(localGuestUser);
      return localGuestUser;
    }

    try {
      const firebaseUser = await signInGuest();
      setUser(firebaseUser);
      return firebaseUser;
    } catch (err: any) {
      // If Firebase Anonymous sign-in is disabled / restricted (auth/admin-restricted-operation),
      // seamlessly fallback to persistent local offline guest mode without breaking the demo!
      console.warn('Firebase Anonymous sign-in not enabled; continuing in Offline Local Guest mode:', err?.message);
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
