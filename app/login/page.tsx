'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { GoogleIcon } from '@/components/GoogleIcon';
import { PinSetupModal } from '@/components/PinSetupModal';
import { hasConfiguredPin, setPin } from '@/lib/app-lock';
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
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const {
    user,
    isGuest,
    loading: authStateLoading,
    unauthorizedDomain,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInGuest,
    sendPasswordReset,
  } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'google' | 'google-redirect' | 'email' | 'guest' | 'reset' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);

  // If already logged in, route immediately
  useEffect(() => {
    if (!authStateLoading && (user || isGuest)) {
      if (!hasConfiguredPin()) {
        setShowPinSetup(true);
      } else {
        router.replace(redirectPath);
      }
    }
  }, [user, isGuest, authStateLoading, router, redirectPath]);

  const activateSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('qr_wallet_session_active', 'true');
    }
  };

  const handlePostAuthSuccess = (emailAddress?: string | null) => {
    if (!hasConfiguredPin()) {
      setShowPinSetup(true);
    } else {
      activateSession();
      router.replace(redirectPath);
    }
  };

  const handleSavePinFromSetup = async (pin: string) => {
    await setPin(pin, user?.email || email);
    activateSession();
    showToast('4-Digit Security PIN configured');
    setShowPinSetup(false);
    router.replace(redirectPath);
  };

  const handleGoogleLogin = async (forceRedirect = false) => {
    setLoadingAction(forceRedirect ? 'google-redirect' : 'google');
    setErrorMessage(null);
    try {
      const loggedUser = await signInWithGoogle(forceRedirect);
      if (loggedUser) {
        showToast('Signed in with Google');
        handlePostAuthSuccess(loggedUser.email);
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
    if (!email || !password) return;

    setLoadingAction('email');
    setErrorMessage(null);
    try {
      if (authMode === 'signup') {
        const newUser = await signUpWithEmail(email, password);
        showToast('Account created & signed in');
        handlePostAuthSuccess(newUser?.email);
      } else {
        const loggedUser = await signInWithEmail(email, password);
        showToast('Signed in successfully');
        handlePostAuthSuccess(loggedUser?.email);
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
      showToast(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Enter your email address above first to receive the reset link.');
      showToast('Enter your email address first');
      return;
    }
    setLoadingAction('reset');
    setErrorMessage(null);
    try {
      await sendPasswordReset(email);
      showToast(`Password reset link sent to ${email}`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to send reset email';
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
      handlePostAuthSuccess(null);
    } catch (err: any) {
      const msg = err?.message || 'Guest sign-in failed';
      setErrorMessage(msg);
      showToast(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const activeDomain = unauthorizedDomain || (typeof window !== 'undefined' ? window.location.hostname : '');

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
          <span>Secure & Encrypted</span>
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
              Sign in to QueueR
            </h1>
            <p className="text-xs text-muted max-w-xs mx-auto mt-1 leading-relaxed">
              Fast, unified QR Ph payment cards with encrypted cloud backup.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-surface rounded-3xl p-5 shadow-sm border border-line/40 space-y-4">
          {/* Diagnostic Card for Firebase Unauthorized Domain */}
          {activeDomain && (unauthorizedDomain || (errorMessage && errorMessage.includes('Unauthorized Domain'))) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-text space-y-2.5 animate-fade-in text-left">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Firebase Domain Authorization Required</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Google OAuth requires registering your deployment domain in your Firebase project.
              </p>
              <div className="flex items-center gap-2 p-2 bg-bg rounded-xl border border-line/40 text-xs font-mono">
                <span className="flex-1 truncate select-all">{activeDomain}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(activeDomain);
                      showToast(`Copied "${activeDomain}" to clipboard`);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-accent text-white text-[11px] font-semibold flex items-center gap-1 hover:bg-accent/90 cursor-pointer shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Domain</span>
                </button>
              </div>
              <div className="text-[11px] text-muted space-y-1">
                <p className="font-semibold text-text">3-Step Fix:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px]">
                  <li>Open Firebase Console &gt; Authentication &gt; Settings</li>
                  <li>Click &quot;Authorized domains&quot; &gt; &quot;Add domain&quot;</li>
                  <li>Paste <code className="bg-line/20 px-1 rounded">{activeDomain}</code> and Save</li>
                </ol>
              </div>
              <a
                href="https://console.firebase.google.com/project/queuer-58b67/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline pt-1"
              >
                <span>Open Firebase Settings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {errorMessage && !errorMessage.includes('Unauthorized Domain') && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-fade-in">
              {errorMessage}
            </div>
          )}

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
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Password
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loadingAction === 'reset'}
                    className="text-[11px] text-accent hover:underline font-semibold cursor-pointer"
                  >
                    {loadingAction === 'reset' ? 'Sending...' : 'Forgot password?'}
                  </button>
                )}
              </div>
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

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={Boolean(loadingAction)}
                className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm shadow-sm hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                {loadingAction === 'email'
                  ? 'Authenticating...'
                  : authMode === 'signup'
                  ? 'Create Account & Continue'
                  : 'Sign In & Continue'}
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-line/30" />
            <span className="text-[11px] uppercase tracking-wider text-muted font-semibold">
              or continue with
            </span>
            <div className="flex-1 h-px bg-line/30" />
          </div>

          {/* Primary Google Login Button */}
          <div className="space-y-1.5">
            <button
              type="button"
              id="google-login-button"
              disabled={Boolean(loadingAction)}
              onClick={() => handleGoogleLogin(false)}
              className="w-full py-3.5 px-4 rounded-2xl bg-surface hover:bg-surface/80 text-text font-bold text-sm flex items-center justify-center gap-3 shadow-sm border border-line/60 hover:border-accent active:scale-[0.98] transition-all cursor-pointer group disabled:opacity-50"
            >
              <GoogleIcon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              <span>
                {loadingAction === 'google' || loadingAction === 'google-redirect'
                  ? 'Connecting to Google...'
                  : 'Continue with Google'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleGoogleLogin(true)}
              disabled={Boolean(loadingAction)}
              className="w-full text-center text-[11px] text-muted hover:text-accent font-medium py-0.5 cursor-pointer flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <RefreshCw className="w-3 h-3" />
              <span>On mobile or popup blocked? Click for Full Page Redirect</span>
            </button>
          </div>

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

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-surface/80 border border-line/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Smart QR Ph</span>
            </div>
            <p className="text-[11px] text-muted leading-tight">
              Request exact amounts & dynamic notes with standard QR Ph.
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
          <span>End-to-End Encrypted Cloud Storage</span>
        </p>
        <p className="opacity-70">QueueR · Unified Payment QR Cards</p>
      </footer>

      {/* 4-Digit Security PIN Setup Modal */}
      <PinSetupModal
        isOpen={showPinSetup}
        userEmail={user?.email || email}
        title="Create 4-Digit Security PIN"
        onSavePin={handleSavePinFromSetup}
      />
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
