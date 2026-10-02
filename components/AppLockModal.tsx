'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, AlertCircle, ShieldAlert, LogOut, KeyRound } from 'lucide-react';
import { VerifyPinResult } from '@/lib/app-lock';
import { PinPad } from './PinPad';

interface AppLockModalProps {
  isLocked: boolean;
  hasPin: boolean;
  hasPasskey: boolean;
  lockoutSeconds?: number;
  userEmail?: string | null;
  onUnlockPin: (pin: string) => Promise<VerifyPinResult>;
  onUnlockBiometrics: () => Promise<boolean>;
  onForgotPin?: () => void;
  onSignOut?: () => void;
}

export function AppLockModal({
  isLocked,
  hasPin,
  hasPasskey,
  lockoutSeconds = 0,
  userEmail,
  onUnlockPin,
  onUnlockBiometrics,
  onForgotPin,
  onSignOut,
}: AppLockModalProps) {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Automatically attempt biometric prompt if passkey exists on open
  useEffect(() => {
    if (isLocked && hasPasskey && lockoutSeconds <= 0) {
      onUnlockBiometrics().catch(() => {});
    }
  }, [isLocked, hasPasskey, lockoutSeconds, onUnlockBiometrics]);

  // Reset pin input when lockout or locked status changes
  useEffect(() => {
    if (!isLocked) {
      setPin('');
      setErrorMessage(null);
      setHasError(false);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const isLockedOut = lockoutSeconds > 0;

  const handlePinComplete = async (enteredPin: string) => {
    if (isLockedOut || loading) return;
    setLoading(true);
    setErrorMessage(null);
    setHasError(false);

    const result = await onUnlockPin(enteredPin);
    setLoading(false);

    if (result.success) {
      setPin('');
    } else {
      setHasError(true);
      if (result.isLockedOut) {
        setErrorMessage(`Too many attempts. Locked out for ${result.remainingLockoutSeconds}s.`);
      } else {
        const remaining = 5 - (result.attemptsCount % 5);
        if (remaining > 0 && remaining <= 3) {
          setErrorMessage(`Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        } else {
          setErrorMessage('Incorrect PIN. Please try again.');
        }
      }
      // Clear PIN on error after brief visual feedback
      setTimeout(() => {
        setPin('');
        setHasError(false);
      }, 600);
    }
  };

  const handleBiometricClick = async () => {
    if (isLockedOut || loading) return;
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
      <div className="w-full max-w-xs space-y-5">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-3xl bg-accent/15 text-accent mx-auto flex items-center justify-center shadow-inner">
          {isLockedOut ? (
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          ) : (
            <Lock className="w-8 h-8" />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text">QueueR Locked</h2>
          <p className="text-xs text-muted mt-1 leading-relaxed truncate px-2">
            {isLockedOut
              ? `Temporarily locked out due to repeated failed attempts.`
              : userEmail
              ? `Enter 4-digit PIN for ${userEmail}`
              : `Enter 4-digit security PIN to unlock`}
          </p>
        </div>

        {/* Lockout Countdown Alert */}
        {isLockedOut && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Try again in {lockoutSeconds} seconds</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && !isLockedOut && (
          <div className="p-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold animate-shake">
            {errorMessage}
          </div>
        )}

        {/* 4-Digit Interactive PinPad */}
        {hasPin && (
          <PinPad
            pin={pin}
            onChange={(newPin) => {
              setErrorMessage(null);
              setPin(newPin);
            }}
            onComplete={handlePinComplete}
            disabled={isLockedOut || loading}
            error={hasError}
            showBiometrics={hasPasskey}
            onBiometricClick={handleBiometricClick}
          />
        )}

        {/* Biometrics Alternative Button if no keypad slot */}
        {!hasPin && hasPasskey && !isLockedOut && (
          <button
            type="button"
            onClick={handleBiometricClick}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-surface hover:bg-surface/80 border border-line/60 text-text font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer"
          >
            <Fingerprint className="w-5 h-5 text-accent" />
            <span>Unlock with Biometrics</span>
          </button>
        )}

        {/* Bottom Actions: Forgot PIN & Sign Out */}
        <div className="flex items-center justify-between pt-2 px-1 text-xs">
          {onForgotPin ? (
            <button
              type="button"
              onClick={onForgotPin}
              className="text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Forgot PIN?</span>
            </button>
          ) : (
            <span />
          )}

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-muted hover:text-red-500 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
