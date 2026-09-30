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
    isDemo,
    loading: authStateLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signInGuest,
    signInDemo,
    signOut,
  } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'google' | 'email' | 'guest' | 'reset' | 'demo' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingAction('google');
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const loggedInUser = await signInWithGoogle();
      if (loggedInUser) {
        showToast('Signed in with Google');
        router.push(redirectPath);
      }
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
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (authMode === 'forgot') {
      setLoadingAction('reset');
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMessage(`Password reset link sent to ${cleanEmail}. Check your inbox!`);
        showToast('Password reset link sent');
      } catch (err: any) {
        const msg = err?.message || 'Failed to send reset link.';
        setErrorMessage(msg);
        showToast(msg);
      } finally {
        setLoadingAction(null);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (authMode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setLoadingAction('email');
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(cleanEmail, password);
        showToast('Account created successfully');
      } else {
        await signInWithEmail(cleanEmail, password);
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
    setSuccessMessage(null);
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

  const handleDemoLogin = async () => {
    setLoadingAction('demo');
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await signInDemo();
      showToast('Welcome to QueueR Demo Preview');
      router.push(redirectPath);
    } catch (err: any) {
      const msg = err?.message || 'Failed to launch demo';
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
      {/* Main Container */}
      <main className="my-auto py-6 space-y-6">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-[24px] p-1 shadow-[0_10px_30px_rgba(0,122,255,0.25)] mx-auto flex items-center justify-center bg-white dark:bg-white/10 border border-line/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/QueueR.png"
              alt="QueueR Logo"
              className="w-full h-full rounded-[20px] object-contain"
            />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text">
              {user && !isGuest
                ? 'Your QueueR Account'
                : authMode === 'forgot'
                ? 'Reset Password'
                : 'Welcome to QueueR'}
            </h1>
            <p className="text-xs text-muted max-w-xs mx-auto mt-1 leading-relaxed">
              {authMode === 'forgot'
                ? 'Enter your email address and we will send you a password reset link.'
                : 'Skip the queue. Flash your QueueR. Fast, secure QR Ph cards & smart bill splitting.'}
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
            {isGuest && authMode !== 'forgot' && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  You are in <b>Guest Mode</b>. Sign in to automatically sync your existing cards safely across all your devices.
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-fade-in">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-fade-in flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Primary Google Login Button (only in Sign In / Sign Up modes) */}
            {authMode !== 'forgot' && (
              <>
                <button
                  type="button"
                  id="google-login-button"
                  disabled={Boolean(loadingAction)}
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 px-4 rounded-2xl bg-surface hover:bg-surface/80 text-text font-bold text-sm flex items-center justify-center gap-3 shadow-sm border border-line/60 hover:border-accent active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
                >
                  {loadingAction === 'google' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  ) : (
                    <GoogleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                  )}
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
              </>
            )}

            {/* Email / Password / Forgot Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Email Address
                </label>
                <div className="flex items-center bg-bg border border-line/60 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-2xl px-3.5 py-3 shadow-xs transition-all gap-3">
                  <Mail className="w-4 h-4 text-muted shrink-0" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm text-text outline-none p-0 placeholder:text-muted/60"
                  />
                </div>
              </div>

              {authMode !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">
                      Password
                    </label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setSuccessMessage(null);
                          setAuthMode('forgot');
                        }}
                        className="text-[11px] text-accent hover:underline font-semibold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="flex items-center bg-bg border border-line/60 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-2xl px-3.5 py-3 shadow-xs transition-all gap-3">
                    <Lock className="w-4 h-4 text-muted shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-text outline-none p-0 placeholder:text-muted/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="text-muted hover:text-text p-0.5 cursor-pointer shrink-0 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {authMode === 'signup' && (
                    <p className="text-[10px] text-muted pl-1">
                      Must be at least 6 characters
                    </p>
                  )}
                </div>
              )}

              <div className="pt-1 space-y-2">
                <button
                  type="submit"
                  disabled={Boolean(loadingAction)}
                  className="w-full py-3 rounded-2xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loadingAction === 'email' || loadingAction === 'reset' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : null}
                  <span>
                    {authMode === 'forgot'
                      ? loadingAction === 'reset'
                        ? 'Sending reset link...'
                        : 'Send Password Reset Link'
                      : authMode === 'signup'
                      ? loadingAction === 'email'
                        ? 'Creating Account...'
                        : 'Create Account'
                      : loadingAction === 'email'
                      ? 'Signing in...'
                      : 'Sign In with Email'}
                  </span>
                </button>

                {authMode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setAuthMode('signin');
                    }}
                    className="w-full text-center text-xs text-muted hover:text-accent font-medium py-1 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    }}
                    className="w-full text-center text-xs text-muted hover:text-accent font-medium py-1 cursor-pointer"
                  >
                    {authMode === 'signin'
                      ? "Don't have an account? Create one"
                      : 'Already have an account? Sign in'}
                  </button>
                )}
              </div>
            </form>

            {/* Demo Mode & Guest Mode Options */}
            {authMode !== 'forgot' && (
              <div className="pt-2 border-t border-line/20 space-y-2">
                <button
                  type="button"
                  disabled={Boolean(loadingAction)}
                  onClick={handleDemoLogin}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 text-accent font-bold text-xs flex items-center justify-center gap-2 border border-accent/25 active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Try Live Demo (Interactive Preview)</span>
                </button>

                {!isGuest && !isDemo && (
                  <button
                    type="button"
                    disabled={Boolean(loadingAction)}
                    onClick={handleGuestLogin}
                    className="w-full py-2 px-3 rounded-xl text-[11px] font-medium text-muted hover:text-text hover:bg-bg/60 flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>Local Offline Guest Mode</span>
                  </button>
                )}
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
