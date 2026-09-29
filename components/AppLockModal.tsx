'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, AlertCircle, ShieldAlert } from 'lucide-react';
import { VerifyPinResult } from '@/lib/app-lock';

interface AppLockModalProps {
  isLocked: boolean;
  hasPin: boolean;
  hasPasskey: boolean;
  lockoutSeconds?: number;
  onUnlockPin: (pin: string) => Promise<VerifyPinResult>;
  onUnlockBiometrics: () => Promise<boolean>;
}

export function AppLockModal({
  isLocked,
  hasPin,
  hasPasskey,
  lockoutSeconds = 0,
  onUnlockPin,
  onUnlockBiometrics,
}: AppLockModalProps) {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Automatically attempt biometric prompt if passkey exists
  useEffect(() => {
    if (isLocked && hasPasskey && lockoutSeconds <= 0) {
      onUnlockBiometrics().then(() => {
        // Handled silently
      });
    }
  }, [isLocked, hasPasskey, lockoutSeconds, onUnlockBiometrics]);

  if (!isLocked) return null;

  const isLockedOut = lockoutSeconds > 0;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || isLockedOut) return;
    setLoading(true);
    setErrorMessage(null);

    const result = await onUnlockPin(pin);
    setLoading(false);
    setPin('');

    if (!result.success) {
      if (result.isLockedOut) {
        setErrorMessage(`Too many attempts. Try again in ${result.remainingLockoutSeconds}s.`);
      } else {
        const remaining = 5 - (result.attemptsCount % 5);
        if (remaining > 0 && remaining <= 3) {
          setErrorMessage(`Incorrect PIN. ${remaining} attempts remaining before lockout.`);
        } else {
          setErrorMessage('Incorrect PIN. Please try again.');
        }
      }
    }
  };

  const handleBiometricClick = async () => {
    if (isLockedOut) return;
    setLoading(true);
    await onUnlockBiometrics();
    setLoading(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App Locked"
      className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-fade-in text-center select-none"
    >
      <div className="w-full max-w-xs space-y-6">
        <div className="w-16 h-16 rounded-full bg-accent/15 text-accent mx-auto flex items-center justify-center shadow-inner">
          {isLockedOut ? (
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          ) : (
            <Lock className="w-8 h-8" />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">QueueR Locked</h2>
          <p className="text-xs text-muted mt-1">
            {isLockedOut
              ? `Temporarily locked out due to repeated failed attempts.`
              : `Enter your PIN or use biometrics to access cards`}
          </p>
        </div>

        {/* Lockout Banner */}
        {isLockedOut && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Try again in {lockoutSeconds} seconds</span>
          </div>
        )}

        {hasPin && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus={!isLockedOut}
              disabled={isLockedOut || loading}
              maxLength={6}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setErrorMessage(null);
                setPin(e.target.value.replace(/\D/g, ''));
              }}
              className={`w-full bg-surface border ${
                errorMessage ? 'border-red-500 ring-1 ring-red-500' : 'border-line/60 focus:border-accent'
              } rounded-2xl px-4 py-3.5 text-center text-2xl font-mono tracking-widest text-text outline-none transition-all shadow-sm disabled:opacity-40`}
            />

            {errorMessage && !isLockedOut && (
              <p className="text-xs font-semibold text-red-500 animate-fade-in">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !pin || isLockedOut}
              className="w-full py-3.5 rounded-2xl bg-accent text-white font-semibold text-base shadow-fab hover:bg-accent/90 active:scale-98 transition-all disabled:opacity-40 cursor-pointer"
            >
              Unlock
            </button>
          </form>
        )}

        {hasPasskey && !isLockedOut && (
          <button
            type="button"
            onClick={handleBiometricClick}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-surface hover:bg-surface/80 border border-line/60 text-text font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer"
          >
            <Fingerprint className="w-5 h-5 text-accent" />
            <span>Unlock with Biometrics</span>
          </button>
        )}

        {/* Forgot PIN Helper */}
        <div className="pt-2 text-[11px] text-muted leading-relaxed">
          <span>Forgot PIN? Re-authenticating with your Firebase account resets the local lock.</span>
        </div>
      </div>
    </div>
  );
}
