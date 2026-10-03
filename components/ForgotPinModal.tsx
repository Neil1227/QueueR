'use client';

import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Lock, LogOut, ArrowLeft } from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';
import { useAuth } from '@/hooks/useAuth';

interface ForgotPinModalProps {
  isOpen: boolean;
  userEmail?: string | null;
  onClose: () => void;
  onVerifiedReset: () => void;
  onSignOut: () => void;
}

export function ForgotPinModal({
  isOpen,
  userEmail,
  onClose,
  onVerifiedReset,
  onSignOut,
}: ForgotPinModalProps) {
  const { user, signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState(userEmail || user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifyMode, setVerifyMode] = useState<'options' | 'password'>('options');

  if (!isOpen) return null;

  const targetEmail = email || userEmail || user?.email || '';

  const handleGoogleVerify = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('qr_wallet_reset_pin_pending', 'true');
      }
      const res = await signInWithGoogle();
      if (res) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('qr_wallet_reset_pin_pending');
        }
        onVerifiedReset();
      }
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('qr_wallet_reset_pin_pending');
      }
      setErrorMessage(err?.message || 'Google verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !password) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithEmail(targetEmail, password);
      onVerifiedReset();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Incorrect password. Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Forgot PIN Verification"
      className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-fade-in text-center select-none"
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Forgot 4-Digit PIN?</h2>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Verify ownership of your account via Google or your account password to reset and configure a new 4-digit PIN.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold animate-fade-in">
            {errorMessage}
          </div>
        )}

        {verifyMode === 'password' ? (
          <form onSubmit={handlePasswordVerify} className="space-y-3 bg-surface p-5 rounded-3xl border border-line/50 animate-fade-in">
            <div className="text-left space-y-1">
              <label className="text-[11px] font-semibold text-muted uppercase">Account Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg border border-line/50 rounded-2xl px-3.5 py-2.5 text-xs text-text outline-none focus:border-accent"
              />
            </div>
            <div className="text-left space-y-1">
              <label className="text-[11px] font-semibold text-muted uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg border border-line/50 rounded-2xl px-3.5 py-2.5 text-xs text-text outline-none focus:border-accent"
              />
            </div>
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 rounded-2xl bg-accent text-white font-bold text-xs shadow-sm hover:bg-accent/90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify Password & Reset PIN'}
              </button>
              <button
                type="button"
                onClick={() => setVerifyMode('options')}
                className="text-xs text-muted hover:text-text cursor-pointer py-1"
              >
                ← Back to other options
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 bg-surface p-5 rounded-3xl border border-line/50">
            {/* Quick Google Verify */}
            <button
              type="button"
              onClick={handleGoogleVerify}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-accent text-white font-bold text-xs shadow-sm hover:bg-accent/90 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Verify with Google & Reset PIN</span>
            </button>

            {/* Password Verification Option */}
            <button
              type="button"
              onClick={() => setVerifyMode('password')}
              className="w-full py-2.5 px-4 rounded-2xl bg-bg border border-line/40 text-muted hover:text-text font-semibold text-xs active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Verify with Account Password</span>
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text font-semibold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="text-red-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
