'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, QrCode, Lock, ArrowRight, X } from 'lucide-react';

interface SignUpPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function SignUpPromptModal({
  isOpen,
  onClose,
  title = 'Sign Up to Add & Save Cards',
  description = 'You are currently in Preview Demo Mode. Create a free account or sign in to save, encrypt, and sync your real Philippine bank and e-wallet QR cards across all your devices.',
}: SignUpPromptModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToSignUp = () => {
    onClose();
    router.push('/login');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign Up Required"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-sm rounded-[28px] bg-surface text-text border border-line/40 p-6 shadow-2xl space-y-5 my-auto animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-bg text-muted hover:text-text transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo / Badge Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-indigo-600 p-[1.5px] shadow-[0_8px_25px_rgba(0,122,255,0.3)] mx-auto flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/QueueR.png"
              alt="QueueR Logo"
              className="w-full h-full rounded-[14px] object-contain bg-white dark:bg-black/40"
            />
          </div>

          <h3 className="text-xl font-bold tracking-tight text-text">
            {title}
          </h3>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 bg-bg/80 p-3.5 rounded-2xl border border-line/30 text-xs">
          <div className="flex items-center gap-2.5 text-text/90 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Client-side WebCrypto 256-bit encryption</span>
          </div>
          <div className="flex items-center gap-2.5 text-text/90 font-medium">
            <QrCode className="w-4 h-4 text-accent shrink-0" />
            <span>Store unlimited GCash, Maya, and 70+ bank cards</span>
          </div>
          <div className="flex items-center gap-2.5 text-text/90 font-medium">
            <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>PIN protection & biometric passkey lock</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleGoToSignUp}
            className="w-full py-3.5 px-4 rounded-2xl bg-accent text-white font-bold text-sm shadow-md hover:bg-accent/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Free Account / Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-2xl text-xs font-semibold text-muted hover:text-text hover:bg-bg/60 transition-all cursor-pointer"
          >
            Keep Exploring Demo
          </button>
        </div>
      </div>
    </div>
  );
}
