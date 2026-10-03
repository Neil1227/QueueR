'use client';

import React, { useEffect, useCallback } from 'react';
import { Delete, Fingerprint } from 'lucide-react';

interface PinPadProps {
  pin: string;
  onChange: (pin: string) => void;
  onComplete?: (pin: string) => void;
  maxLength?: number;
  disabled?: boolean;
  error?: boolean;
  showBiometrics?: boolean;
  onBiometricClick?: () => void;
}

const KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
];

export function PinPad({
  pin,
  onChange,
  onComplete,
  maxLength = 4,
  disabled = false,
  error = false,
  showBiometrics = false,
  onBiometricClick,
}: PinPadProps) {
  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled || pin.length >= maxLength) return;
      const next = pin + digit;
      onChange(next);
      if (next.length === maxLength && onComplete) {
        onComplete(next);
      }
    },
    [pin, maxLength, disabled, onChange, onComplete]
  );

  const handleDelete = useCallback(() => {
    if (disabled || pin.length === 0) return;
    onChange(pin.slice(0, -1));
  }, [pin, disabled, onChange]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleDigit, handleDelete]);

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto select-none">
      {/* 4-Dot PIN Indicator Display */}
      <div
        className={`flex items-center justify-center gap-4 py-3 mb-6 transition-transform ${
          error ? 'animate-shake' : ''
        }`}
      >
        {Array.from({ length: maxLength }).map((_, idx) => {
          const filled = idx < pin.length;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                filled
                  ? 'bg-accent scale-110 shadow-[0_0_12px_rgba(0,122,255,0.6)] border-2 border-accent'
                  : 'bg-surface border-2 border-line/60 scale-100'
              }`}
            />
          );
        })}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-3.5 w-full">
        {KEYS.map((k) => (
          <button
            key={k.digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(k.digit)}
            className="h-16 rounded-2xl bg-surface hover:bg-surface/80 active:bg-accent/20 active:scale-95 border border-line/50 flex flex-col items-center justify-center transition-all duration-150 shadow-xs disabled:opacity-40 cursor-pointer group"
          >
            <span className="text-2xl font-bold tracking-tight text-text group-hover:text-accent transition-colors">
              {k.digit}
            </span>
            {k.letters ? (
              <span className="text-[10px] font-bold tracking-wider text-neutral-600 dark:text-neutral-400 -mt-0.5">
                {k.letters}
              </span>
            ) : null}
          </button>
        ))}

        {/* Bottom Row: Biometrics / Empty, 0, Backspace */}
        <div className="flex items-center justify-center">
          {showBiometrics && onBiometricClick ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onBiometricClick}
              title="Unlock with Biometrics"
              className="w-full h-16 rounded-2xl bg-surface hover:bg-surface/80 active:scale-95 border border-line/50 flex items-center justify-center text-accent transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            >
              <Fingerprint className="w-6 h-6" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-surface hover:bg-surface/80 active:bg-accent/20 active:scale-95 border border-line/50 flex flex-col items-center justify-center transition-all duration-150 shadow-xs disabled:opacity-40 cursor-pointer group"
        >
          <span className="text-2xl font-bold tracking-tight text-text group-hover:text-accent transition-colors">
            0
          </span>
        </button>

        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleDelete}
          title="Delete digit"
          aria-label="Delete last digit"
          className="h-16 rounded-2xl bg-surface hover:bg-surface/80 active:scale-95 border border-line/50 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-text transition-all shadow-xs disabled:opacity-30 cursor-pointer"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
