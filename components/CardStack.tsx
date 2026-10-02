'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card as CardType, CardCategory, CARD_CATEGORIES } from '@/lib/schema';
import { bringToFront, PreviewNumberFormat } from '@/lib/cards';
import { Card } from './Card';
import { CategoryIcon } from './CategoryIcon';
import { CardStackSkeleton } from './CardStackSkeleton';
import { Settings, Plus, CreditCard, Sparkles, FolderPlus } from 'lucide-react';

interface CardStackProps {
  cards: CardType[];
  loading?: boolean;
  numberFormat?: PreviewNumberFormat;
  hideAddButton?: boolean;
  onOpenCard: (card: CardType) => void;
  onAddCard: (category?: CardCategory) => void;
  onOpenSettings: () => void;
}

export function CardStack({
  cards,
  loading = false,
  numberFormat = 'last4',
  hideAddButton = false,
  onOpenCard,
  onAddCard,
  onOpenSettings,
}: CardStackProps) {
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'all'>('all');
  const [announcement, setAnnouncement] = useState<string>('');
  const [customDeck, setCustomDeck] = useState<CardType[] | null>(null);

  // Calculate card counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: cards.length };
    for (const card of cards) {
      const cat = card.category || 'personal';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [cards]);

  // Filter cards based on selected category
  const filteredCards = useMemo(() => {
    if (selectedCategory === 'all') return cards;
    return cards.filter((c) => (c.category || 'personal') === selectedCategory);
  }, [cards, selectedCategory]);

  // Synchronous displayCards: always immediate, never lagging or flashing an empty state
  const displayCards = useMemo(() => {
    if (!customDeck) return filteredCards;
    const valid = customDeck.filter((c) => filteredCards.some((fc) => fc.id === c.id));
    const added = filteredCards.filter((fc) => !customDeck.some((c) => c.id === fc.id));
    const updated = valid.map((c) => filteredCards.find((fc) => fc.id === c.id) || c);
    return [...updated, ...added];
  }, [customDeck, filteredCards]);

  const handleSelectCategory = (cat: CardCategory | 'all') => {
    setSelectedCategory(cat);
    setCustomDeck(null);
  };

  const handleCardClick = (card: CardType, slotIndex: number) => {
    if (slotIndex === 0) {
      // Tapping the front card opens the QR Receive view without reordering
      onOpenCard(card);
    } else {
      // Tapping a card behind brings it to the front; old front card moves to the back
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } catch {
        // Ignore haptics error
      }

      const newDeck = bringToFront(displayCards, card.id);
      setCustomDeck(newDeck);
      setAnnouncement(`${card.provider} is now in front`);
    }
  };

  const currentCategoryMeta = selectedCategory !== 'all'
    ? CARD_CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const countText = displayCards.length
    ? `${displayCards.length} ${displayCards.length === 1 ? 'card' : 'cards'}`
    : '';

  // Calculate visible peeking strips (up to 5 peeking strips above the front card)
  const totalStrips = Math.min(Math.max(0, displayCards.length - 1), 5);
  // Container height = peeking header strips (56px each) + full front card height (210px)
  const containerHeight = totalStrips * 56 + 210;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-lg mx-auto pb-[calc(100px+env(safe-area-inset-bottom,0px))]">
      {/* Live Region for Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Apple Wallet Navigation Header */}
      <header className="px-5 pt-8 pb-2 flex items-baseline justify-between sticky top-0 bg-bg/85 backdrop-blur-xl z-40 transition-colors">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[34px] font-bold tracking-tight text-text leading-tight">
            QueueR
          </h1>
          {countText && <span className="text-sm font-medium text-muted">{countText}</span>}
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open Settings"
          className="p-2.5 rounded-full text-muted hover:text-text hover:bg-surface active:scale-95 transition-all shadow-sm border border-line/20 cursor-pointer"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Category Filter Chips Bar */}
      {cards.length > 0 && (
        <div className="px-5 pt-1 pb-2 sticky top-[72px] bg-bg/85 backdrop-blur-xl z-30 transition-colors">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm ${selectedCategory === 'all'
                  ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F]'
                  : 'bg-surface text-muted hover:text-text border border-line/40'
                }`}
            >
              <CategoryIcon category="all" className="w-3.5 h-3.5" />
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedCategory === 'all'
                    ? 'bg-white/20 dark:bg-black/20'
                    : 'bg-black/5 dark:bg-white/10'
                  }`}
              >
                {cards.length}
              </span>
            </button>

            {CARD_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isSelected = selectedCategory === cat.id;

              // Show if has cards or if currently selected
              if (count === 0 && !isSelected) return null;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm ${isSelected
                      ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F]'
                      : 'bg-surface text-muted hover:text-text border border-line/40'
                    }`}
                >
                  <CategoryIcon category={cat.id} className="w-3.5 h-3.5" />
                  <span>{cat.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected
                        ? 'bg-white/20 dark:bg-black/20'
                        : 'bg-black/5 dark:bg-white/10'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Card Deck Area */}
      <main aria-label="Your payment cards deck" className="px-4 pt-3 flex-1">
        {cards.length === 0 ? (
          <div className="text-center py-24 px-6 text-muted space-y-4">
            <div className="w-20 h-20 rounded-full bg-surface border border-line/40 mx-auto flex items-center justify-center text-muted shadow-sm">
              <CreditCard className="w-10 h-10 opacity-60 text-accent" />
            </div>
            <div>
              <b className="block text-xl font-semibold text-text">No Cards in QueueR</b>
              <p className="text-sm leading-relaxed max-w-xs mx-auto mt-1 text-muted">
                Add your bank and e-wallet QR codes to show and receive payments in one tap.
              </p>
            </div>
          </div>
        ) : displayCards.length === 0 ? (
          // Category-specific Empty State
          <div className="text-center py-16 px-6 text-muted space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-surface border border-line/40 mx-auto flex items-center justify-center text-accent shadow-sm">
              <CategoryIcon category={selectedCategory} className="w-8 h-8" />
            </div>
            <div>
              <b className="block text-lg font-semibold text-text">
                No {currentCategoryMeta?.label || 'Category'} Cards
              </b>
              <p className="text-xs leading-relaxed max-w-xs mx-auto mt-1 text-muted">
                You don&apos;t have any cards saved under {currentCategoryMeta?.label || 'this category'} yet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAddCard(selectedCategory !== 'all' ? selectedCategory : undefined)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-white font-semibold text-xs shadow-md hover:bg-accent/90 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add {currentCategoryMeta?.shortLabel || 'Category'} Card</span>
            </button>
          </div>
        ) : (
          <div
            style={{ height: `${containerHeight}px` }}
            className="relative w-full transition-[height] duration-450 ease-spring"
          >
            {displayCards.map((card, idx) => (
              <Card
                key={card.id}
                card={card}
                slotIndex={idx}
                totalStrips={totalStrips}
                totalCards={displayCards.length}
                isFront={idx === 0}
                numberFormat={numberFormat}
                onClick={() => handleCardClick(card, idx)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Circular Floating Add Card Button (56px, Bottom Right) */}
      {!hideAddButton && (
        <button
          type="button"
          id="add"
          aria-label="Add card"
          onClick={() => onAddCard(selectedCategory !== 'all' ? selectedCategory : undefined)}
          style={{
            position: 'fixed',
            right: '20px',
            bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#007AFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(0, 122, 255, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            zIndex: 30,
            cursor: 'pointer',
          }}
          className="text-white hover:brightness-105 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 transition-all duration-150"
        >
          <Plus className="w-6 h-6 text-white stroke-[2.5]" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

