'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardInput, CardCategory, CARD_CATEGORIES } from '@/lib/schema';
import { PROVIDERS, DEFAULT_PROVIDER } from '@/lib/providers';
import { ProviderChips } from './ProviderChips';
import { QRPreview } from './QRPreview';
import { processQRImage } from '@/lib/qr';
import { useToast } from './Toast';
import { BankLogo } from './BankLogo';
import { BankPickerModal } from './BankPickerModal';
import { findBankBrand, getCategoryLabel, BankBrandInfo } from '@/lib/bank-logos';
import { formatInputAccountNumber } from '@/lib/cards';
import { CategoryIcon } from './CategoryIcon';
import { Building2, Sparkles, Check } from 'lucide-react';

interface EditorSheetProps {
  card: Card | null;
  isOpen: boolean;
  initialCategory?: CardCategory;
  onClose: () => void;
  onSave: (data: CardInput) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
}

export function EditorSheet({
  card,
  isOpen,
  initialCategory,
  onClose,
  onSave,
  onDelete,
}: EditorSheetProps) {
  const [provider, setProvider] = useState('GCash');
  const [color, setColor] = useState('#007DFE');
  const [customColor, setCustomColor] = useState('#007AFF');
  const [preset, setPreset] = useState('GCash');
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<CardCategory>('personal');
  const [isDefault, setIsDefault] = useState(false);
  const [payload, setPayload] = useState<string | null>(null);
  const [imgB64, setImgB64] = useState<string | null>(null);
  const [logoB64, setLogoB64] = useState<string | null>(null);
  const [qrMessage, setQrMessage] = useState<string>('');
  const [qrSuccess, setQrSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);

  const { showToast } = useToast();

  // Initialize or reset form when sheet opens or card changes
  useEffect(() => {
    if (isOpen) {
      if (card) {
        const foundPreset = PROVIDERS.find(
          (p) => p[0] === card.provider && p[1].toLowerCase() === card.color.toLowerCase()
        );
        const presetName = foundPreset ? foundPreset[0] : 'Custom';
        setProvider(card.provider);
        setColor(card.color);
        setCustomColor(card.color);
        setPreset(presetName);
        setHolder(card.holder || '');
        setNumber(card.number ? formatInputAccountNumber(card.number) : '');
        setLabel(card.label || '');
        setCategory(card.category || 'personal');
        setIsDefault(card.isDefault || false);
        setPayload(card.payload || null);
        setImgB64(card.imgB64 || null);
        setLogoB64(card.logoB64 || null);
        setQrMessage(
          card.payload
            ? 'QR verified and ready.'
            : card.imgB64
            ? 'Using stored QR image.'
            : 'Upload or paste to replace QR.'
        );
        setQrSuccess(Boolean(card.payload));
      } else {
        setProvider(DEFAULT_PROVIDER[0]);
        setColor(DEFAULT_PROVIDER[1]);
        setCustomColor('#007AFF');
        setPreset(DEFAULT_PROVIDER[0]);
        setHolder('');
        setNumber('');
        setLabel('');
        setCategory(initialCategory || 'personal');
        setIsDefault(false);
        setPayload(null);
        setImgB64(null);
        setLogoB64(null);
        setQrMessage('Upload a screenshot or paste one from your clipboard.');
        setQrSuccess(false);
      }
    }
  }, [isOpen, card, initialCategory]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      showToast('Logo file must be under 200 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoB64(ev.target?.result as string);
      showToast('Custom logo added');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProcessBlob = useCallback(
    async (blob: Blob) => {
      try {
        const result = await processQRImage(blob);
        setPayload(result.payload);
        setImgB64(result.imgB64);
        setQrMessage(result.message);
        setQrSuccess(result.success);
        if (result.success) {
          showToast('QR code scanned successfully');
        } else if (result.imgB64) {
          showToast('QR image captured as fallback');
        }
      } catch {
        showToast("Couldn't process that image");
      }
    },
    [showToast]
  );

  // Document-level paste listener while editor is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleProcessBlob(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, handleProcessBlob]);

  const handlePresetSelect = (name: string, brandColor: string) => {
    setPreset(name);
    if (name === 'Custom') {
      setColor(customColor);
    } else {
      setColor(brandColor);
      setProvider(name);
    }
  };

  const handleSelectBankFromPicker = (brand: BankBrandInfo) => {
    setProvider(brand.name);
    setColor(brand.color);
    setCustomColor(brand.color);
    setPreset(brand.name);
    showToast(`Selected ${brand.name}`);
  };

  const detectedBrand = findBankBrand(provider);

  const handleClipboardPasteButton = async () => {
    try {
      if (!navigator.clipboard?.read) {
        showToast('Clipboard reading not supported. Use Ctrl/Cmd+V to paste.');
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          await handleProcessBlob(blob);
          return;
        }
      }
      showToast('No image on clipboard');
    } catch {
      showToast('Copy the QR image first, then press Ctrl/Cmd+V here');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProvider = provider.trim();
    if (!cleanProvider) {
      showToast('Enter the bank or e-wallet name');
      return;
    }
    if (!payload && !imgB64) {
      showToast('Add the payment QR first');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: card?.id,
        provider: cleanProvider,
        color,
        holder: holder.trim(),
        number: number.trim(),
        label: label.trim(),
        category,
        payload,
        imgB64,
        logoB64,
        isDefault,
      });
      showToast('Card saved');
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save card');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    if (window.confirm('Delete this card? This cannot be undone.')) {
      try {
        await onDelete(card.id);
        showToast('Card deleted');
        onClose();
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete card');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={card ? 'Edit card' : 'Add card'}
      className="fixed inset-0 z-40 bg-bg text-text overflow-y-auto pt-[calc(6px+env(safe-area-inset-top,0px))] px-5 pb-[calc(24px+env(safe-area-inset-bottom,0px))] animate-slide-up flex flex-col"
    >
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-center min-h-[36px] py-1 mb-0.5">
          <button
            type="button"
            onClick={onClose}
            className="text-accent font-semibold text-base py-1 px-1 active:opacity-70 cursor-pointer"
          >
            Cancel
          </button>
          <span className="font-semibold text-base">{card ? 'Edit Card' : 'New Card'}</span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="text-accent font-semibold text-base py-1 px-1 active:opacity-70 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 mb-3.5">
          {card ? 'Edit card' : 'Add card'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          {/* Provider Chips & Full Directory Link */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                Provider Preset
              </label>
              <button
                type="button"
                onClick={() => setIsBankPickerOpen(true)}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>All 70+ Banks</span>
              </button>
            </div>
            <ProviderChips
              selectedPreset={preset}
              onSelectPreset={handlePresetSelect}
            />
          </div>

          {/* Custom Color Row */}
          {preset === 'Custom' && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-2xl animate-fade-in border border-line">
              <input
                type="color"
                aria-label="Custom Card Color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setColor(e.target.value);
                }}
                className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer p-0"
              />
              <span className="text-sm font-medium text-text">Choose custom card color</span>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="fProv" className="text-xs font-semibold text-text/80">
                Bank / e-wallet name
              </label>
              <button
                type="button"
                onClick={() => setIsBankPickerOpen(true)}
                className="text-xs font-medium text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3 h-3" />
                <span>Browse Directory</span>
              </button>
            </div>

            <div className="flex items-center bg-surface border border-line/60 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 rounded-2xl px-3.5 py-3 shadow-sm transition-all gap-3">
              <div className="shrink-0 flex items-center justify-center">
                <BankLogo provider={provider} customLogo={logoB64} color={color} size={26} />
              </div>
              <input
                id="fProv"
                type="text"
                required
                value={provider}
                onChange={(e) => {
                  const val = e.target.value;
                  setProvider(val);
                  const matched = findBankBrand(val);
                  if (matched && matched.name.toLowerCase() === val.toLowerCase().trim()) {
                    setColor(matched.color);
                    setPreset(matched.name);
                  }
                }}
                placeholder="e.g. GCash, Maya, MariBank, SeaBank, BPI, BDO"
                className="w-full bg-transparent text-base text-text outline-none p-0 placeholder:text-muted/60"
              />
            </div>

            {/* Smart Bank Detection Indicator */}
            {detectedBrand && (
              <div className="mt-2 p-2.5 rounded-xl bg-surface/70 border border-line/50 flex items-center justify-between text-xs animate-fade-in">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <BankLogo provider={detectedBrand.name} color={detectedBrand.color} size={20} className="shrink-0" />
                  <div className="truncate flex-1">
                    <span className="font-semibold text-text">{detectedBrand.name}</span>
                    <span className="text-muted ml-1.5 font-normal">({getCategoryLabel(detectedBrand.category)})</span>
                  </div>
                </div>
                {color.toLowerCase() !== detectedBrand.color.toLowerCase() && (
                  <button
                    type="button"
                    onClick={() => {
                      setColor(detectedBrand.color);
                      setCustomColor(detectedBrand.color);
                      setPreset(detectedBrand.name);
                      showToast(`Applied ${detectedBrand.name} brand color`);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Apply Brand Color</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="fHolder" className="block text-xs font-semibold text-text/80 mb-1.5">
              Account name
            </label>
            <input
              id="fHolder"
              type="text"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="w-full bg-surface border border-line/60 focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-2xl px-4 py-3.5 text-base text-text outline-none transition-all shadow-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="fNum" className="text-xs font-semibold text-text/80">
                Account or mobile number
              </label>
              {number && (
                <span className="text-[11px] font-medium text-muted font-mono">
                  {(() => {
                    const digits = number.replace(/\D/g, '');
                    if (digits.startsWith('09') && digits.length === 11) return 'PH Mobile (11 digits)';
                    if (digits.length === 16) return '16-digit Card / Account';
                    if (digits.length === 12) return '12-digit Bank Account';
                    if (digits.length === 10) return '10-digit Bank Account';
                    return `${digits.length} digits`;
                  })()}
                </span>
              )}
            </div>
            <input
              id="fNum"
              type="tel"
              value={number}
              onChange={(e) => setNumber(formatInputAccountNumber(e.target.value))}
              placeholder="e.g. 0917 123 4567 or 1234 5678 9012"
              className="w-full bg-surface border border-line/60 focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-2xl px-4 py-3.5 text-base font-mono text-text outline-none transition-all shadow-sm"
            />
          </div>

          {/* Card Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-text/80 mb-2">
              Card Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CARD_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-accent/15 text-accent border-accent shadow-sm ring-1 ring-accent/30'
                        : 'bg-surface text-text/80 border-line/40 hover:border-line'
                    }`}
                  >
                    <CategoryIcon category={cat.id} className="w-4 h-4" />
                    <span className="truncate max-w-full text-[11px] font-medium">{cat.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="fLabel" className="block text-xs font-semibold text-text/80 mb-1.5">
              Nickname (optional)
            </label>
            <input
              id="fLabel"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Personal, Shop, Savings…"
              className="w-full bg-surface border border-line/60 focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-2xl px-4 py-3.5 text-base text-text outline-none transition-all shadow-sm"
            />
          </div>

          {/* Optional Custom Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Custom Logo (optional, max 200 KB)
            </label>
            <div className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-line/40 shadow-sm">
              {logoB64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoB64}
                  alt="Custom Logo"
                  className="w-12 h-12 object-contain rounded-lg bg-bg p-1 border border-line/40"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-bg border border-line/40 flex items-center justify-center text-xs text-muted">
                  None
                </div>
              )}
              <div className="flex-1 min-w-0">
                <label className="inline-block px-3 py-1.5 rounded-xl bg-bg hover:bg-bg/80 border border-line text-xs font-semibold cursor-pointer">
                  <span>{logoB64 ? 'Replace Logo' : 'Upload PNG/SVG'}</span>
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoB64 && (
                  <button
                    type="button"
                    onClick={() => setLogoB64(null)}
                    className="ml-2 text-xs text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Payment QR Slot */}
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Payment QR Code
            </label>
            <QRPreview
              payload={payload}
              imgB64={imgB64}
              message={qrMessage}
              isSuccess={qrSuccess}
              onFileSelect={handleProcessBlob}
              onPasteClick={handleClipboardPasteButton}
            />
          </div>

          {/* Default Card Switch */}
          <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-line/40 shadow-sm">
            <span className="text-sm font-medium text-text pr-2">
              Open this card first when app launches
            </span>
            <input
              type="checkbox"
              id="fDef"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              aria-label="Set as default card"
              className="w-5 h-5 accent-accent rounded cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 pb-6 space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base shadow-fab hover:bg-accent/90 active:scale-98 transition-all disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save card'}
            </button>

            {card && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 font-semibold text-base transition-all active:scale-98"
              >
                Delete card
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Full Philippine Bank Directory Modal */}
      <BankPickerModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        onSelectBank={handleSelectBankFromPicker}
        currentProvider={provider}
      />
    </div>
  );
}
