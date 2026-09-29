'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/lib/schema';
import {
  computeKKB,
  generateKKBTextRequest,
  generateKKBReceiptCanvas,
  KKBRoundingMode,
  PAX_PRESETS,
} from '@/lib/kkb';
import { downloadCanvasAsPNG, shareOrDownloadImage } from '@/lib/image-share';
import { useToast } from './Toast';
import {
  X,
  Users,
  Receipt,
  Plus,
  Minus,
  Copy,
  Share2,
  Coins,
  QrCode,
  Check,
} from 'lucide-react';

interface KkbModalProps {
  isOpen: boolean;
  card: Card;
  initialAmount?: number | null;
  onClose: () => void;
  onApplyToQR: (amount: number, note: string) => void;
}

export function KkbModal({
  isOpen,
  card,
  initialAmount,
  onClose,
  onApplyToQR,
}: KkbModalProps) {
  const { showToast } = useToast();

  const [billStr, setBillStr] = useState(initialAmount ? String(initialAmount) : '');
  const [pax, setPax] = useState<number>(2);
  const [rounding, setRounding] = useState<KKBRoundingMode>('exact');
  const [noteStr, setNoteStr] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse numeric values
  const numericBill = Math.max(0, parseFloat(billStr) || 0);

  // Compute live KKB result
  const kkbResult = useMemo(() => {
    return computeKKB({
      totalBill: numericBill,
      pax,
      rounding,
    });
  }, [numericBill, pax, rounding]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (initialAmount && initialAmount > 0) {
        setBillStr(String(initialAmount));
      }
    } else {
      document.body.style.overflow = '';
      setCopied(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialAmount]);

  if (!isOpen) return null;

  const handleApplyToQR = () => {
    if (kkbResult.roundedShare <= 0) {
      showToast('Enter total bill amount first');
      return;
    }
    const note = noteStr.trim() ? `${noteStr.trim()} (${pax} pax)` : `KKB (${pax} pax)`;
    onApplyToQR(kkbResult.roundedShare, note);
    showToast(`QR set to ₱${kkbResult.roundedShare.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / person`);
    onClose();
  };

  const handleCopyText = async () => {
    if (kkbResult.roundedShare <= 0) {
      showToast('Enter total bill amount first');
      return;
    }
    const text = generateKKBTextRequest(card, kkbResult, noteStr);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        showToast('KKB summary copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      showToast('Failed to copy text');
    }
  };

  const handleShareReceipt = async () => {
    if (kkbResult.roundedShare <= 0) {
      showToast('Enter total bill amount first');
      return;
    }
    setIsExporting(true);
    try {
      const receiptCanvas = await generateKKBReceiptCanvas(card, kkbResult, noteStr);
      await shareOrDownloadImage(receiptCanvas, `${card.provider}-kkb-receipt`);
      showToast('Receipt ready');
    } catch {
      showToast('Failed to generate receipt');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="KKB Bill Splitter"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/65 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface text-text rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-line/60 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-line/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-text leading-tight">
                KKB Smart Bill Splitter
              </h3>
              <p className="text-xs text-muted font-normal">
                Kanya-Kanyang Bayad calculator for {card.provider}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close KKB modal"
            className="p-1.5 rounded-full hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-150px)]">
          {/* Total Bill Input */}
          <div>
            <label
              htmlFor="fKkbBill"
              className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5"
            >
              Total Bill Amount
            </label>
            <div className="flex items-center bg-bg border border-line/80 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-2xl px-4 py-3 shadow-sm transition-all">
              <span className="text-2xl sm:text-3xl font-bold text-text/75 select-none mr-2 shrink-0">
                ₱
              </span>
              <input
                id="fKkbBill"
                type="number"
                step="0.01"
                min="1"
                max="500000"
                required
                value={billStr}
                onChange={(e) => setBillStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-text outline-none tabular-nums placeholder:text-muted/40 p-0"
                autoFocus
              />
            </div>
          </div>

          {/* Number of People (Pax) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text/80 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-accent" />
                <span>Number of People (Pax)</span>
              </label>
              <span className="text-xs font-bold font-mono text-accent">
                {pax} {pax === 1 ? 'person' : 'people'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPax((prev) => Math.max(1, prev - 1))}
                disabled={pax <= 1}
                aria-label="Decrease pax count"
                className="w-12 h-12 rounded-2xl bg-bg border border-line/60 hover:bg-surface active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center text-text font-bold cursor-pointer shrink-0"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex-1 flex items-center justify-center bg-bg rounded-2xl border border-line/60 py-2.5 px-3">
                <span className="text-xl font-bold text-text font-mono tabular-nums">
                  {pax}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPax((prev) => Math.min(50, prev + 1))}
                disabled={pax >= 50}
                aria-label="Increase pax count"
                className="w-12 h-12 rounded-2xl bg-bg border border-line/60 hover:bg-surface active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center text-text font-bold cursor-pointer shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pax Preset Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2 pt-0.5">
              {PAX_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPax(p)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                    pax === p
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-bg text-muted hover:text-text border border-line/40'
                  }`}
                >
                  {p} pax
                </button>
              ))}
            </div>
          </div>

          {/* Rounding Mode Options */}
          <div>
            <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Centavo Rounding</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: 'exact', label: 'Exact .00' },
                  { id: 'up_1', label: 'Round ₱1' },
                  { id: 'up_5', label: 'Round ₱5' },
                  { id: 'up_10', label: 'Round ₱10' },
                ] as const
              ).map((r) => {
                const isSelected = rounding === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRounding(r.id)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-semibold text-center border transition-all active:scale-95 cursor-pointer truncate ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500 shadow-sm'
                        : 'bg-bg text-text/80 border-line/40 hover:border-line'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label
              htmlFor="fKkbNote"
              className="block text-xs font-semibold text-muted mb-1.5"
            >
              Purpose / Note (optional)
            </label>
            <input
              id="fKkbNote"
              type="text"
              maxLength={30}
              value={noteStr}
              onChange={(e) => setNoteStr(e.target.value)}
              placeholder="e.g. Dinner with Friends, Samgyup, Coffee"
              className="w-full bg-bg border border-line/60 focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-xl px-3.5 py-2.5 text-sm text-text outline-none transition-all shadow-sm"
            />
          </div>

          {/* Live Calculation Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/10 via-surface to-accent/5 border border-accent/30 shadow-inner">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>Total Bill ({pax} pax)</span>
              <span className="font-mono font-semibold text-text">
                ₱{kkbResult.totalBill.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-line/30">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                  Each Person Pays
                </span>
                <span className="text-[11px] text-muted/80">
                  (₱{kkbResult.totalBill.toFixed(2)} ÷ {pax} pax)
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-accent font-mono tabular-nums">
                  ₱{kkbResult.roundedShare.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {kkbResult.roundingDiff > 0 && (
              <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                • +₱{kkbResult.roundingDiff.toFixed(2)} extra collected from rounding up
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-5 border-t border-line/50 bg-surface shrink-0 space-y-2.5">
          {/* Primary Action: Apply to QR */}
          <button
            type="button"
            onClick={handleApplyToQR}
            disabled={kkbResult.roundedShare <= 0}
            className="w-full py-3.5 rounded-2xl bg-accent text-white font-semibold text-base shadow-fab hover:bg-accent/90 active:scale-98 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
            <span>Apply Share to My QR (₱{kkbResult.roundedShare.toFixed(2)})</span>
          </button>

          {/* Secondary Actions Row: Copy Text & Share Receipt Image */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              disabled={kkbResult.roundedShare <= 0}
              className="py-2.5 px-3 rounded-xl bg-bg hover:bg-bg/80 border border-line/60 text-xs sm:text-sm font-semibold text-text active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-muted" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              disabled={kkbResult.roundedShare <= 0 || isExporting}
              className="py-2.5 px-3 rounded-xl bg-bg hover:bg-bg/80 border border-line/60 text-xs sm:text-sm font-semibold text-text active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Share2 className="w-4 h-4 text-muted" />
              <span>{isExporting ? 'Generating…' : 'Share Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
