'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { GoogleIcon } from '@/components/GoogleIcon';
import {
  QrCode,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  KeyRound,
  LogOut,
  Sparkles,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const {
    user,
    isGuest,
    loading: authStateLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInGuest,
    signOut,
  } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [e2eePassphrase, setE2eePassphrase] = useState('');
  const [showE2EEInput, setShowE2EEInput] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'google' | 'email' | 'guest' | 'unlock' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activateSession = (passphrase?: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qr_wallet_session_active', 'true');
      if (passphrase && passphrase.trim()) {
        sessionStorage.setItem('qr_wallet_e2ee_passphrase', passphrase.trim());
      } else {
        sessionStorage.removeItem('qr_wallet_e2ee_passphrase');
      }
    }
  };

  const handleUnlockExistingSession = () => {
    setLoadingAction('unlock');
    activateSession(e2eePassphrase);
    showToast('Wallet unlocked');
    router.replace(redirectPath);
  };

  const handleGoogleLogin = async () => {
    setLoadingAction('google');
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      activateSession(e2eePassphrase);
      showToast('Signed in with Google');
      router.replace(redirectPath);
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in failed. Please try again.';
      setErrorMessage(msg);
      showToast(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoadingAction('email');
    setErrorMessage(null);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
        activateSession(e2eePassphrase);
        showToast('Account created & signed in');
      } else {
        await signInWithEmail(email, password);
        activateSession(e2eePassphrase);
        showToast('Signed in successfully');
      }
      router.replace(redirectPath);
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
      showToast(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGuestLogin = async () => {
    setLoadingAction('guest');
    setErrorMessage(null);
    try {
      await signInGuest();
      activateSession(e2eePassphrase);
      showToast('Continuing in Guest Mode (Offline Storage)');
      router.replace(redirectPath);
    } catch (err: any) {
      const msg = err?.message || 'Guest sign-in failed';
      setErrorMessage(msg);
      showToast(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('qr_wallet_session_active');
        sessionStorage.removeItem('qr_wallet_e2ee_passphrase');
      }
      await signOut();
      showToast('Signed out');
    } catch (err: any) {
      showToast(err?.message || 'Sign out failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto px-5 py-6">
      {/* Top Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white shadow-sm">
            <QrCode className="w-4 h-4 stroke-[2.4]" />
          </div>
          <span className="text-sm font-bold tracking-tight text-text">QueueR</span>
        </div>

        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>AES-256 E2EE</span>
        </span>
      </header>

      {/* Main Container */}
      <main className="my-auto py-6 space-y-5">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-accent via-blue-600 to-indigo-600 p-[1.5px] shadow-[0_8px_25px_rgba(0,122,255,0.35)] mx-auto flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <QrCode className="w-8 h-8 text-white stroke-[2.2]" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text">
              {user && !isGuest ? 'Unlock QueueR Wallet' : 'Sign in to QueueR'}
            </h1>
            <p className="text-xs text-muted max-w-xs mx-auto mt-1 leading-relaxed">
              Names & account numbers are automatically encrypted with AES-256 before saving to the cloud.
            </p>
          </div>
        </div>

        {/* Form or Account Unlock Container */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-line/40 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}

          {/* Already Logged In State */}
          {user && !isGuest ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 bg-bg rounded-2xl border border-line/30 flex items-center gap-3">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-11 h-11 rounded-full object-cover border border-white/40 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 truncate flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-text truncate">
                      {user.displayName || 'Google User'}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.2 rounded-full shrink-0">
                      <span>Active</span>
                    </span>
                  </div>
                  <span className="text-xs text-muted truncate block mt-0.5">
                    {user.email || 'Connected'}
                  </span>
                </div>
              </div>

              {/* Optional E2EE Passphrase Toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowE2EEInput(!showE2EEInput)}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{showE2EEInput ? 'Hide E2EE Passphrase' : 'Enter Custom E2EE Passphrase (Optional)'}</span>
                </button>

                {showE2EEInput && (
                  <div className="space-y-1 animate-fade-in">
                    <input
                      type="password"
                      placeholder="Custom E2EE Vault Passphrase"
                      value={e2eePassphrase}
                      onChange={(e) => setE2eePassphrase(e.target.value)}
                      className="w-full bg-bg border border-line/50 rounded-2xl px-3.5 py-2.5 text-xs text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-xs transition-all"
                    />
                    <p className="text-[10px] text-muted">
                      Leave blank to use your automatic per-user AES-256 encryption key.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleUnlockExistingSession}
                  disabled={Boolean(loadingAction)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-accent text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-accent/90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>Unlock & Open Wallet</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-4 rounded-2xl bg-surface hover:bg-red-500/10 text-red-500 font-semibold text-xs flex items-center justify-center gap-1.5 border border-line/40 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account / Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Sign In / Sign Up Form */
            <div className="space-y-4">
              {/* Primary Google Login Button */}
              <button
                type="button"
                id="google-login-button"
                disabled={Boolean(loadingAction)}
                onClick={handleGoogleLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-surface hover:bg-surface/80 text-text font-bold text-sm flex items-center justify-center gap-3 shadow-sm border border-line/60 hover:border-accent active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
              >
                <GoogleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                <span>
                  {loadingAction === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-line/30" />
                <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                  or email & password
                </span>
                <div className="flex-1 h-px bg-line/30" />
              </div>

              {/* Email / Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg border border-line/50 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-xs transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-bg border border-line/50 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 text-muted hover:text-text p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Optional E2EE Passphrase Toggle */}
                <div className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowE2EEInput(!showE2EEInput)}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{showE2EEInput ? 'Hide E2EE Passphrase' : 'Custom E2EE Passphrase (Optional)'}</span>
                  </button>

                  {showE2EEInput && (
                    <div className="space-y-1 animate-fade-in pt-1">
                      <input
                        type="password"
                        placeholder="Optional Master E2EE Passphrase"
                        value={e2eePassphrase}
                        onChange={(e) => setE2eePassphrase(e.target.value)}
                        className="w-full bg-bg border border-line/50 rounded-2xl px-3.5 py-2 text-xs text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-xs transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={Boolean(loadingAction)}
                    className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loadingAction === 'email'
                      ? 'Authenticating...'
                      : authMode === 'signup'
                      ? 'Create Account & Unlock'
                      : 'Sign In & Unlock'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    className="w-full text-center text-xs text-muted hover:text-accent font-medium py-1 cursor-pointer"
                  >
                    {authMode === 'signin'
                      ? "Don't have an account? Create one"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>

              {/* Continue as Guest */}
              <div className="pt-2 border-t border-line/20">
                <button
                  type="button"
                  disabled={Boolean(loadingAction)}
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 px-3 rounded-2xl text-xs font-semibold text-muted hover:text-text hover:bg-bg/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Explore as Guest (Offline Local Mode)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-surface/80 border border-line/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Smart QR Ph</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Request exact amounts & dynamic notes with CRC-16 EMVCo.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-surface/80 border border-line/30 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>KKB Splitter</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Split bills with equal & centavo rounding in 1 tap.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-muted space-y-1 pt-4 border-t border-line/20">
        <p className="flex items-center justify-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" />
          <span>Client-side WebCrypto AES-256 GCM Zero-Knowledge Encryption</span>
        </p>
        <p className="opacity-70">QueueR · Unified Payment QR Cards</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
