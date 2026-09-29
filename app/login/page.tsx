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
  ArrowLeft,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  Sparkles,
  LogOut,
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
  const [loadingAction, setLoadingAction] = useState<'google' | 'email' | 'guest' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingAction('google');
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google');
      router.push(redirectPath);
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
        showToast('Account created & signed in');
      } else {
        await signInWithEmail(email, password);
        showToast('Signed in successfully');
      }
      router.push(redirectPath);
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
      showToast('Continuing in Guest Mode (Offline Storage)');
      router.push(redirectPath);
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
      await signOut();
      showToast('Signed out');
    } catch (err: any) {
      showToast(err?.message || 'Sign out failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto px-5 py-6">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text px-3 py-1.5 rounded-full bg-surface/80 border border-line/30 shadow-2xs backdrop-blur-md active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Wallet</span>
        </Link>

        <span className="text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/10 px-2.5 py-0.5 rounded-full">
          Cloud Sync
        </span>
      </header>

      {/* Main Container */}
      <main className="my-auto py-6 space-y-6">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-accent via-blue-600 to-indigo-600 p-[1.5px] shadow-[0_8px_25px_rgba(0,122,255,0.35)] mx-auto flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <QrCode className="w-8 h-8 text-white stroke-[2.2]" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text">
              {user && !isGuest ? 'Your QueueR Account' : 'Welcome to QueueR'}
            </h1>
            <p className="text-xs text-muted max-w-xs mx-auto mt-1 leading-relaxed">
              Skip the queue. Flash your QueueR. Fast, secure QR Ph cards & smart bill splitting.
            </p>
          </div>
        </div>

        {/* Already Logged In Card */}
        {user && !isGuest ? (
          <div className="bg-surface rounded-3xl p-5 shadow-sm border border-line/40 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profile'}
                  className="w-12 h-12 rounded-full object-cover border border-white/40 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
                  {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 truncate flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-text truncate">
                    {user.displayName || 'Google Account'}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.2 rounded-full">
                    <GoogleIcon className="w-2.5 h-2.5" />
                    <span>Active</span>
                  </span>
                </div>
                <span className="text-xs text-muted truncate block mt-0.5">
                  {user.email || 'Connected'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-line/20 space-y-2">
              <Link
                href="/"
                className="w-full py-3 px-4 rounded-2xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-accent/90 active:scale-[0.98] transition-all"
              >
                <span>Go to My Cards Deck</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-2xl bg-surface hover:bg-red-500/10 text-red-500 font-semibold text-xs flex items-center justify-center gap-1.5 border border-line/40 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Form Container */
          <div className="bg-surface rounded-3xl p-5 shadow-sm border border-line/40 space-y-4">
            {isGuest && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  You are in <b>Guest Mode</b>. Sign in with Google to sync your cards safely across all devices.
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-fade-in">
                {errorMessage}
              </div>
            )}

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
                or with email
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

              <div className="pt-1 space-y-2">
                <button
                  type="submit"
                  disabled={Boolean(loadingAction)}
                  className="w-full py-3 rounded-2xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loadingAction === 'email'
                    ? 'Authenticating...'
                    : authMode === 'signup'
                    ? 'Create Account'
                    : 'Sign In with Email'}
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
            {!isGuest && (
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
            )}
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
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
          <span>Client-side WebCrypto encryption & Passkey ready</span>
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
