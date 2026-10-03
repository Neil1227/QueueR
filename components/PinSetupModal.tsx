'use client';

import React, { useState } from 'react';
import { ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { PinPad } from './PinPad';

interface PinSetupModalProps {
  isOpen: boolean;
  userEmail?: string | null;
  onSavePin: (pin: string) => Promise<void>;
  onCancel?: () => void;
  title?: string;
}

export function PinSetupModal({
  isOpen,
  userEmail,
  onSavePin,
  onCancel,
  title = 'Create 4-Digit Security PIN',
}: PinSetupModalProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleFirstPinComplete = (enteredPin: string) => {
    setFirstPin(enteredPin);
    setPin('');
    setStep('confirm');
    setErrorMessage(null);
  };

  const handleConfirmPinComplete = async (confirmPin: string) => {
    if (confirmPin !== firstPin) {
      setHasError(true);
      setErrorMessage('PINs did not match. Please try again.');
      setTimeout(() => {
        setPin('');
        setFirstPin('');
        setStep('create');
        setHasError(false);
      }, 900);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await onSavePin(confirmPin);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save PIN');
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Set Up Security PIN"
      className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-fade-in text-center select-none"
    >
      <div className="w-full max-w-xs space-y-6">
        {/* Official QueueR Logo */}
        <img
          src="/QueueRLogo.png"
          alt="QueueR Logo"
          className="w-20 h-20 rounded-3xl object-cover shadow-[0_8px_30px_rgba(0,122,255,0.25)] mx-auto"
        />

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black tracking-tight text-text">
            {step === 'create' ? title : 'Confirm 4-Digit PIN'}
          </h2>
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-snug px-2">
            {step === 'create'
              ? userEmail
                ? `Enter a 4-digit PIN to secure QueueR on this device for ${userEmail}`
                : 'Enter a 4-digit PIN to secure your wallet on this device'
              : 'Re-enter the 4-digit PIN to confirm'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted">
          <span className={step === 'create' ? 'text-accent font-bold' : 'text-text'}>
            1. Set PIN
          </span>
          <span>→</span>
          <span className={step === 'confirm' ? 'text-accent font-bold' : 'text-muted'}>
            2. Confirm PIN
          </span>
        </div>

        {/* Interactive 4-Digit Keypad */}
        <PinPad
          pin={pin}
          onChange={(newPin) => {
            setErrorMessage(null);
            setPin(newPin);
          }}
          onComplete={step === 'create' ? handleFirstPinComplete : handleConfirmPinComplete}
          disabled={loading}
          error={hasError}
        />

        {step === 'confirm' && (
          <button
            type="button"
            onClick={() => {
              setPin('');
              setFirstPin('');
              setStep('create');
              setErrorMessage(null);
            }}
            className="text-xs font-semibold text-accent hover:underline cursor-pointer"
          >
            ← Back to change PIN
          </button>
        )}

        {onCancel && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-muted hover:text-text cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
