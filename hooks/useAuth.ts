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
import { DEMO_USER_ID, isDemoActive, setDemoActive } from '@/lib/demo';

export interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isDemo: boolean;
  isConfigured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInGuest: () => Promise<User | null>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is in demo preview mode
    if (isDemoActive()) {
      setIsDemo(true);
      setUser({
        uid: DEMO_USER_ID,
        isAnonymous: true,
        email: 'demo@queuer.app',
        displayName: 'Demo Previewer',
      } as unknown as User);
      setLoading(false);
      return;
    }

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
          setDemoActive(false);
          setIsDemo(false);
          setUser(redirectUser);
        }
      })
      .catch((err) => {
        console.warn('Redirect sign-in resolution error:', err);
      });

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setDemoActive(false);
          setIsDemo(false);
          setUser(currentUser);
        } else if (isDemoActive()) {
          setIsDemo(true);
          setUser({
            uid: DEMO_USER_ID,
            isAnonymous: true,
            email: 'demo@queuer.app',
            displayName: 'Demo Previewer',
          } as unknown as User);
        } else {
          setUser(null);
        }
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
    setDemoActive(false);
    setIsDemo(false);
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
      const loggedIn = await signInWithGoogle();
      if (loggedIn) {
        setUser(loggedIn);
      }
      return loggedIn;
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleSignInEmail = async (email: string, pass: string) => {
    setError(null);
    setDemoActive(false);
    setIsDemo(false);
    try {
      const userRes = await signInWithEmail(email, pass);
      setUser(userRes);
      return userRes;
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleSignUpEmail = async (email: string, pass: string) => {
    setError(null);
    setDemoActive(false);
    setIsDemo(false);
    try {
      const userRes = await signUpWithEmail(email, pass);
      setUser(userRes);
      return userRes;
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
    setDemoActive(false);
    setIsDemo(false);
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

  const handleSignInDemo = async () => {
    setError(null);
    setDemoActive(true);
    setIsDemo(true);
    const demoUser = {
      uid: DEMO_USER_ID,
      isAnonymous: true,
      email: 'demo@queuer.app',
      displayName: 'Demo Previewer',
    } as unknown as User;
    setUser(demoUser);
  };

  const handleSignOut = async () => {
    setError(null);
    setDemoActive(false);
    setIsDemo(false);
    if (!auth) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('qr_wallet_local_guest_uid');
        localStorage.removeItem('qr_wallet_local_google_user');
      }
      setUser(null);
      return;
    }
    await logOut();
    setUser(null);
  };

  return {
    user,
    loading,
    isGuest: Boolean(user?.isAnonymous) && !isDemo,
    isDemo,
    isConfigured: isFirebaseConfigured,
    error,
    signInWithGoogle: handleSignInGoogle,
    signInWithEmail: handleSignInEmail,
    signUpWithEmail: handleSignUpEmail,
    sendPasswordReset: handleSendPasswordReset,
    signInGuest: handleSignInGuest,
    signInDemo: handleSignInDemo,
    signOut: handleSignOut,
  };
}

