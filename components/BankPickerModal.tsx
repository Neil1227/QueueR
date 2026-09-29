'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BankBrandInfo,
  BankCategory,
  searchBanks,
  getCategoryLabel,
} from '@/lib/bank-logos';
import { BankLogo } from './BankLogo';
import { Search, X, Check, Building2, Smartphone, Landmark, Globe } from 'lucide-react';

interface BankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBank: (brand: BankBrandInfo) => void;
  currentProvider?: string;
}

const CATEGORIES: { key: BankCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All Banks', icon: <Landmark className="w-3.5 h-3.5" /> },
  { key: 'e-wallet', label: 'E-Wallets', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { key: 'digital-bank', label: 'Digital Banks', icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: 'universal-bank', label: 'Universal Banks', icon: <Landmark className="w-3.5 h-3.5" /> },
  { key: 'thrift-bank', label: 'Thrift & Savings', icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: 'international', label: 'Remittance', icon: <Globe className="w-3.5 h-3.5" /> },
];

export function BankPickerModal({
  isOpen,
  onClose,
  onSelectBank,
  currentProvider,
}: BankPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BankCategory | 'all'>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const filteredBanks = useMemo(() => {
    return searchBanks(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select Philippine Bank or E-Wallet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg text-text w-full max-w-lg h-[82vh] max-h-[85vh] sm:h-[620px] rounded-t-[28px] sm:rounded-[28px] flex flex-col shadow-2xl overflow-hidden border border-line animate-slide-up"
      >
        {/* Grab Handle for Mobile */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted/40" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 sm:py-4 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Philippine Banks & Wallets</h3>
            <p className="text-xs text-muted">Select from all 70+ BSP-regulated banks and e-wallets</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bank selector"
            className="p-2 rounded-full hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-line/60 bg-surface/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bank name (e.g. MariBank, GCash, Maya, BPI, BDO)..."
              className="w-full bg-surface border border-line/80 focus:border-accent rounded-xl pl-10 pr-9 py-2.5 text-sm text-text outline-none transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto mt-2.5 pb-1 scrollbar-none snap-x">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-surface text-muted hover:text-text hover:bg-surface/80'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bank List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-line/30 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
          {filteredBanks.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-sm font-medium">No banks found for &ldquo;{searchQuery}&rdquo;</p>
              <p className="text-xs mt-1">You can still type any custom provider name manually.</p>
            </div>
          ) : (
            filteredBanks.map((brand) => {
              const isCurrent =
                currentProvider?.toLowerCase() === brand.name.toLowerCase() ||
                (brand.shortName && currentProvider?.toLowerCase() === brand.shortName.toLowerCase());

              return (
                <button
                  key={brand.name}
                  type="button"
                  onClick={() => {
                    onSelectBank(brand);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer hover:bg-surface active:scale-[0.99] ${
                    isCurrent ? 'bg-surface/80 ring-1 ring-accent' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <BankLogo
                      provider={brand.name}
                      color={brand.color}
                      size={36}
                      showBackground={true}
                    />
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text truncate">
                          {brand.name}
                        </span>
                        {brand.shortName && brand.shortName !== brand.name && (
                          <span className="text-[11px] font-medium text-muted truncate">
                            ({brand.shortName})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate mt-0.5">
                        {brand.description || getCategoryLabel(brand.category)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: brand.color }}
                      title={`Brand Color: ${brand.color}`}
                    />
                    {isCurrent && <Check className="w-4 h-4 text-accent stroke-[2.5]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
