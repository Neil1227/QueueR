'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card as CardType } from '@/lib/schema';
import { bringToFront, PreviewNumberFormat } from '@/lib/cards';
import { Card } from './Card';
import { Settings, Plus, CreditCard } from 'lucide-react';

interface CardStackProps {
  cards: CardType[];
  numberFormat?: PreviewNumberFormat;
  hideAddButton?: boolean;
  onOpenCard: (card: CardType) => void;
  onAddCard: () => void;
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
  // Temporary client-side deck order: index 0 is front card, higher indices are stacked behind
  const [deck, setDeck] = useState<CardType[]>(cards);
  const [announcement, setAnnouncement] = useState<string>('');
  const prevCardsRef = useRef<CardType[]>(cards);

  // Synchronize deck when cards are added, deleted, or loaded
  useEffect(() => {
    const prevCards = prevCardsRef.current;
    prevCardsRef.current = cards;

    if (cards.length === 0) {
      setDeck([]);
      return;
    }

    setDeck((currentDeck) => {
      if (currentDeck.length === 0) {
        return cards;
      }

      // Check for removed cards
      const validCards = currentDeck.filter((dc) => cards.some((c) => c.id === dc.id));
      // Update any modified card details in place
      const updatedDeck = validCards.map((dc) => {
        const fresh = cards.find((c) => c.id === dc.id);
        return fresh || dc;
      });

      // Check for newly added cards -> append to the back of the deck
      const newCards = cards.filter((c) => !currentDeck.some((dc) => dc.id === c.id));
      if (newCards.length > 0) {
        return [...updatedDeck, ...newCards];
      }

      return updatedDeck.length > 0 ? updatedDeck : cards;
    });
  }, [cards]);

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

  const countText = deck.length
    ? `${deck.length} ${deck.length === 1 ? 'card' : 'cards'}`
    : '';

  // Calculate visible peeking strips (up to 5 peeking strips above the front card)
  const totalStrips = Math.min(Math.max(0, deck.length - 1), 5);
  // Container height = peeking header strips (56px each) + full front card height (210px)
  const containerHeight = totalStrips * 56 + 210;

  return (
    <div className="min-h-screen flex flex-col w-full max-w-lg mx-auto pb-[calc(100px+env(safe-area-inset-bottom,0px))]">
      {/* Live Region for Screen Reader Announcements */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Apple Wallet Navigation Header */}
      <header className="px-5 pt-8 pb-3 flex items-baseline justify-between sticky top-0 bg-bg/80 backdrop-blur-xl z-40 transition-colors">
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

      {/* Card Deck Area */}
      <main aria-label="Your payment cards deck" className="px-4 pt-4 flex-1">
        {deck.length === 0 ? (
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
          onClick={onAddCard}
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
