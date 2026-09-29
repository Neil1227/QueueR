'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card as CardType, CardCategory, CARD_CATEGORIES } from '@/lib/schema';
import { bringToFront, PreviewNumberFormat } from '@/lib/cards';
import { Card } from './Card';
import { CategoryIcon } from './CategoryIcon';
import { Settings, Plus, CreditCard, Sparkles, FolderPlus, QrCode } from 'lucide-react';

interface CardStackProps {
  cards: CardType[];
  numberFormat?: PreviewNumberFormat;
  hideAddButton?: boolean;
  onOpenCard: (card: CardType) => void;
  onAddCard: (category?: CardCategory) => void;
  onOpenSettings: () => void;
}

export function CardStack({
  cards,
  numberFormat = 'last4',
  hideAddButton = false,
  onOpenCard,
  onAddCard,
  onOpenSettings,
}: CardStackProps) {
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'all'>('all');
  const [announcement, setAnnouncement] = useState<string>('');

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

  // Temporary client-side deck order: index 0 is front card, higher indices are stacked behind
  const [deck, setDeck] = useState<CardType[]>(filteredCards);
  const prevFilteredRef = useRef<CardType[]>(filteredCards);

  // Synchronize deck when cards or category filter changes
  useEffect(() => {
    setDeck((currentDeck) => {
      if (filteredCards.length === 0) {
        return [];
      }

      // Check for removed cards
      const validCards = currentDeck.filter((dc) => filteredCards.some((c) => c.id === dc.id));
      // Update any modified card details in place
      const updatedDeck = validCards.map((dc) => {
        const fresh = filteredCards.find((c) => c.id === dc.id);
        return fresh || dc;
      });

      // Check for newly added cards -> append to the back of the deck
      const newCards = filteredCards.filter((c) => !currentDeck.some((dc) => dc.id === c.id));
      if (newCards.length > 0) {
        return [...updatedDeck, ...newCards];
      }

      return updatedDeck.length > 0 ? updatedDeck : filteredCards;
    });
  }, [filteredCards]);

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

      const newDeck = bringToFront(deck, card.id);
      setDeck(newDeck);
      setAnnouncement(`${card.provider} is now in front`);
    }
  };

  const currentCategoryMeta = selectedCategory !== 'all' 
    ? CARD_CATEGORIES.find((c) => c.id === selectedCategory) 
    : null;

  const countText = deck.length
    ? `${deck.length} ${deck.length === 1 ? 'card' : 'cards'}`
    : '';

  // Calculate visible peeking strips (up to 5 peeking strips above the front card)
  const totalStrips = Math.min(Math.max(0, deck.length - 1), 5);
  // Container height = peeking header strips (56px each) + full front card height (215px)
  const containerHeight = totalStrips * 56 + 215;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-lg mx-auto pb-[calc(100px+env(safe-area-inset-bottom,0px))]">
      {/* Live Region for Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Redesigned Apple Wallet Navigation Header */}
      <header className="px-5 pt-7 pb-3 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-2xl z-40 transition-colors border-b border-line/10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Brand Icon Badge */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent via-blue-600 to-indigo-600 p-[1px] shadow-[0_4px_14px_rgba(0,122,255,0.32)] flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[15px] bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
          </div>

          <div className="min-w-0 truncate">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-extrabold tracking-tight text-text leading-none font-sans">
                QueueR
              </h1>
              {countText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface/90 text-muted border border-line/30 text-[11px] font-semibold shadow-2xs backdrop-blur-md">
                  <CreditCard className="w-3 h-3 text-muted/80" />
                  <span>{deck.length}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-muted mt-0.5 tracking-tight truncate">
              Skip the queue · Flash your QueueR
            </p>
          </div>
        </div>

        {/* Action Button: Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open Settings"
          className="w-10 h-10 rounded-2xl bg-surface/80 hover:bg-surface text-muted hover:text-text active:scale-95 transition-all shadow-xs border border-line/30 flex items-center justify-center cursor-pointer group shrink-0 ml-2"
        >
          <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45 text-text" />
        </button>
      </header>

      {/* Category Filter Chips Bar */}
      {cards.length > 0 && (
        <div className="px-5 pt-2 pb-2 sticky top-[73px] bg-bg/80 backdrop-blur-xl z-30 transition-colors border-b border-line/10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                selectedCategory === 'all'
                  ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] border border-transparent shadow-sm'
                  : 'bg-surface/80 hover:bg-surface text-muted hover:text-text border border-line/35'
              }`}
            >
              <CategoryIcon category="all" className="w-3.5 h-3.5" />
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                  selectedCategory === 'all'
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
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    isSelected
                      ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] border border-transparent shadow-sm'
                      : 'bg-surface/80 hover:bg-surface text-muted hover:text-text border border-line/35'
                  }`}
                >
                  <CategoryIcon category={cat.id} className="w-3.5 h-3.5" />
                  <span>{cat.shortLabel}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                      isSelected
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
      <main aria-label="Your payment cards deck" className="px-4 pt-4 flex-1">
        {cards.length === 0 ? (
          <div className="text-center py-20 px-6 text-muted space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-surface/90 border border-line/40 mx-auto flex items-center justify-center text-muted shadow-sm backdrop-blur-md">
              <CreditCard className="w-10 h-10 opacity-70 text-accent" />
            </div>
            <div>
              <b className="block text-xl font-bold text-text">No Cards in QueueR</b>
              <p className="text-sm leading-relaxed max-w-xs mx-auto mt-1.5 text-muted">
                Add your bank and e-wallet QR codes to show and receive payments in one tap.
              </p>
            </div>
          </div>
        ) : deck.length === 0 ? (
          // Category-specific Empty State
          <div className="text-center py-16 px-6 text-muted space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-surface/90 border border-line/40 mx-auto flex items-center justify-center text-accent shadow-sm backdrop-blur-md">
              <CategoryIcon category={selectedCategory} className="w-8 h-8" />
            </div>
            <div>
              <b className="block text-lg font-bold text-text">
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
            {deck.map((card, idx) => (
              <Card
                key={card.id}
                card={card}
                slotIndex={idx}
                totalStrips={totalStrips}
                totalCards={deck.length}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 22px rgba(0, 122, 255, 0.45)',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            zIndex: 30,
            cursor: 'pointer',
          }}
          className="bg-gradient-to-tr from-[#007AFF] to-[#0055D4] text-white hover:brightness-110 active:scale-[0.93] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#007AFF] focus-visible:ring-offset-2 transition-all duration-150"
        >
          <Plus className="w-6 h-6 text-white stroke-[2.5]" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

