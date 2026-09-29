'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
  signInWithGoogle,
  handleRedirectResult,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  signInGuest,
  logOut,
  getAuthErrorMessage,
} from '@/lib/firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isConfigured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInGuest: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      // Local fallback mode if Firebase is not configured or in SSR
      const localGoogleUser = typeof window !== 'undefined' ? localStorage.getItem('qr_wallet_local_google_user') : null;
      const localGuestId = typeof window !== 'undefined' ? localStorage.getItem('qr_wallet_local_guest_uid') : null;
      
      if (localGoogleUser) {
        try {
          setUser(JSON.parse(localGoogleUser));
        } catch {
          // ignore parsing error
        }
      } else if (localGuestId) {
        setUser({ uid: localGuestId, isAnonymous: true, email: null, displayName: 'Local Guest' } as unknown as User);
      }
      setLoading(false);
      return;
    }

    // Check if returning from a mobile redirect sign-in flow
    handleRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          setUser(redirectUser);
        }
      })
      .catch((err) => {
        console.warn('Redirect sign-in resolution error:', err);
      });

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(getAuthErrorMessage(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async () => {
    setError(null);
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
      return await signInWithGoogle();
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleSignInEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      return await signInWithEmail(email, pass);
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleSignUpEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      return await signUpWithEmail(email, pass);
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    setError(null);
    try {
      await sendPasswordReset(email);
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleSignInGuest = async () => {
    setError(null);
    if (!auth) {
      const guestUid = 'local-guest-' + Math.random().toString(36).substring(2, 9);
      if (typeof window !== 'undefined') {
        localStorage.setItem('qr_wallet_local_guest_uid', guestUid);
        localStorage.removeItem('qr_wallet_local_google_user');
      }
      const fakeUser = { uid: guestUid, isAnonymous: true, email: null, displayName: 'Local Guest' } as unknown as User;
      setUser(fakeUser);
      return fakeUser;
    }
    try {
      return await signInGuest();
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    if (!auth) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('qr_wallet_local_guest_uid');
        localStorage.removeItem('qr_wallet_local_google_user');
      }
      setUser(null);
      return;
    }
    await logOut();
  };

  return {
    user,
    loading,
    isGuest: Boolean(user?.isAnonymous),
    isConfigured: isFirebaseConfigured,
    error,
    signInWithGoogle: handleSignInGoogle,
    signInWithEmail: handleSignInEmail,
    signUpWithEmail: handleSignUpEmail,
    sendPasswordReset: handleSendPasswordReset,
    signInGuest: handleSignInGuest,
    signOut: handleSignOut,
  };
}

