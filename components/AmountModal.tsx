'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check, Trash2 } from 'lucide-react';

interface AmountModalProps {
  isOpen: boolean;
  currentAmount?: number | null;
  currentNote?: string | null;
  onClose: () => void;
  onApply: (amount: number, note?: string) => void;
  onClear: () => void;
}

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export function AmountModal({
  isOpen,
  currentAmount,
  currentNote,
  onClose,
  onApply,
  onClear,
}: AmountModalProps) {
  const [mounted, setMounted] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [noteStr, setNoteStr] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAmountStr(currentAmount ? currentAmount.toString() : '');
      setNoteStr(currentNote || '');
    }
  }, [isOpen, currentAmount, currentNote]);

  if (!isOpen || !mounted) return null;

  const numericAmount = parseFloat(amountStr) || 0;

  const handleAddPreset = (val: number) => {
    const next = numericAmount + val;
    setAmountStr(next.toString());
  };

  const handleSetPreset = (val: number) => {
    setAmountStr(val.toString());
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount > 0) {
      onApply(numericAmount, noteStr.trim() || undefined);
      onClose();
    }
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Request Exact Amount"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg text-text w-full max-w-md rounded-t-[28px] sm:rounded-[28px] flex flex-col shadow-2xl overflow-hidden border border-line animate-slide-up pb-[calc(16px+env(safe-area-inset-bottom,0px))]"
      >
        {/* Grab Handle for Mobile */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted/40" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-base font-bold tracking-tight">Request Exact Amount</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close amount modal"
            className="p-1.5 rounded-full hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleApply} className="p-5 space-y-4">
          {/* Main Amount Input */}
          <div>
            <label htmlFor="fAmount" className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Enter Amount (PHP)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-bold text-text/80 select-none">
                ₱
              </span>
              <input
                id="fAmount"
                type="number"
                step="0.01"
                min="1"
                max="500000"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surface border border-line/80 focus:border-accent rounded-2xl pl-10 pr-4 py-3.5 text-2xl sm:text-3xl font-bold text-text outline-none transition-all shadow-sm tabular-nums"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Preset Amount Buttons */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Quick Add Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddPreset(val)}
                  className="py-2 px-2.5 rounded-xl bg-surface hover:bg-surface/80 border border-line/50 text-xs font-semibold text-text active:scale-95 transition-all shadow-sm cursor-pointer text-center"
                >
                  +₱{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note / Purpose */}
          <div>
            <label htmlFor="fNote" className="block text-xs font-semibold text-muted mb-1.5">
              Purpose / Note (optional)
            </label>
            <input
              id="fNote"
              type="text"
              maxLength={25}
              value={noteStr}
              onChange={(e) => setNoteStr(e.target.value)}
              placeholder="e.g. Lunch, Coffee, Rent, KKB"
              className="w-full bg-surface border border-line/60 focus:border-accent rounded-xl px-3.5 py-2.5 text-sm text-text outline-none transition-all shadow-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={numericAmount <= 0}
              className="w-full py-3.5 rounded-2xl bg-accent text-white font-semibold text-base shadow-fab hover:bg-accent/90 active:scale-98 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>
                {numericAmount > 0
                  ? `Embed ₱${numericAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} in QR`
                  : 'Enter Amount'}
              </span>
            </button>

            {currentAmount && currentAmount > 0 ? (
              <button
                type="button"
                onClick={handleClear}
                className="w-full py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 font-semibold text-xs transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Amount from QR</span>
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
