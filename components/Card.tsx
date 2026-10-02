'use client';

import React from 'react';
import { Card as CardType, CARD_CATEGORIES } from '@/lib/schema';
import { fgFor, getCardGradient } from '@/lib/colors';
import { last4, formatPreviewNumber, PreviewNumberFormat } from '@/lib/cards';
import { BankLogo } from './BankLogo';
import { CategoryIcon } from './CategoryIcon';
import { Wifi, QrCode, Star } from 'lucide-react';

interface CardProps {
  card: CardType;
  slotIndex: number;
  totalStrips: number;
  totalCards: number;
  isFront: boolean;
  numberFormat?: PreviewNumberFormat;
  onClick: () => void;
}

export function Card({
  card,
  slotIndex,
  totalStrips,
  totalCards,
  isFront,
  numberFormat = 'last4',
  onClick,
}: CardProps) {
  const fg = fgFor(card.color);
  const gradient = getCardGradient(card.color);

  // Position cards:
  // slotIndex 0 (Front card) sits at bottom: translateY(totalStrips * 56px)
  // slotIndex 1 sits at: translateY((totalStrips - 1) * 56px), etc.
  // Beyond slot 5, cards are hidden beneath the top strip
  const isHiddenSlot = slotIndex > 5;
  const clampedSlot = Math.min(slotIndex, 5);
  const yOffset = (totalStrips - clampedSlot) * 56;
  const scale = isFront ? 1 : Math.max(0.94, 1 - clampedSlot * 0.012);
  const zIndex = isHiddenSlot ? 0 : 30 - clampedSlot;
  const opacity = isHiddenSlot ? 0 : 1;

  // Formatted preview number based on user privacy setting
  const previewNum = isFront
    ? card.number
      ? `•••• ${last4(card.number)}`
      : ''
    : formatPreviewNumber(card.number, numberFormat);

  // Extra hidden cards count on back-most visible strip
  const hiddenCount = totalCards > 6 && clampedSlot === 5 ? totalCards - 6 : 0;

  // Accessible Label
  const accessibleLabel = isFront
    ? `Show QR for ${card.provider}`
    : `Bring ${card.provider}${card.label ? ` ${card.label}` : ''}${
        card.number ? ` ending in ${last4(card.number)}` : ''
      } to front`;

  const categoryMeta = card.category ? CARD_CATEGORIES.find((c) => c.id === card.category) : null;

  return (
    <div
      style={{
        transform: `translate3d(0, ${yOffset}px, 0) scale(${scale})`,
        zIndex,
        opacity,
        pointerEvents: isHiddenSlot ? 'none' : 'auto',
      }}
      className="absolute top-0 left-0 right-0 origin-top transition-transform duration-450 ease-spring transition-opacity will-change-transform"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={accessibleLabel}
        style={{
          background: gradient,
          color: fg,
        }}
        className={`group relative block w-full h-[210px] rounded-[22px] p-0 m-0 text-left select-none overflow-hidden cursor-pointer focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all duration-300 ${
          isFront
            ? 'shadow-[0_22px_45px_-10px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.22)_inset,0_2px_8px_rgba(0,0,0,0.18)] active:scale-[0.99]'
            : 'shadow-[0_-1px_0_rgba(255,255,255,0.2)_inset,0_10px_24px_-4px_rgba(0,0,0,0.28),0_2px_6px_rgba(0,0,0,0.12)] hover:brightness-105 active:scale-[0.99]'
        }`}
      >
        {/* Tactile Ambient Card Sheen & Specular Highlights */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/20 pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 w-52 h-52 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

        {/* Pinned Top Preview Strip (Visible 56px height, pinned to top: 0 on EVERY card) */}
        <div
          style={{ color: fg }}
          className="absolute top-0 left-0 right-0 h-[56px] flex items-center justify-between px-5 z-20 pointer-events-none border-b border-white/10"
        >
          {/* Left: Provider Logo + Provider Name + Nickname + Default Star */}
          <div className="flex items-center gap-2.5 min-w-0 pr-2 truncate">
            <BankLogo
              provider={card.provider}
              color={card.color}
              size={28}
            />
            <span className="font-bold text-[17px] tracking-tight leading-none truncate drop-shadow-sm">
              {card.provider}
            </span>
            {card.label && (
              <span className="text-[14px] font-normal opacity-85 leading-none truncate drop-shadow-sm">
                · {card.label}
              </span>
            )}
            {card.isDefault && (
              <span
                title="Default Card"
                className="inline-flex items-center justify-center text-amber-300 bg-black/30 px-1.5 py-0.5 rounded-full border border-amber-300/30 backdrop-blur-sm shadow-xs flex-shrink-0 ml-0.5"
              >
                <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
              </span>
            )}
          </div>

          {/* Right: "•••• 1234" (tabular numerals, never wraps or shrinks) */}
          <div className="flex items-center gap-2 shrink-0 flex-shrink-0 pl-2">
            {hiddenCount > 0 ? (
              <span className="text-[11px] font-bold uppercase tracking-wider bg-black/35 px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20 shadow-xs">
                +{hiddenCount} more
              </span>
            ) : previewNum ? (
              <span className="font-mono text-[14px] font-semibold opacity-95 tabular-nums whitespace-nowrap shrink-0 drop-shadow-sm tracking-wider">
                {previewNum}
              </span>
            ) : isFront ? (
              <Wifi className="w-4 h-4 rotate-90 opacity-70 shrink-0 drop-shadow-sm" />
            ) : null}
          </div>
        </div>

        {/* EMV Chip & Category Badge (Only shown in the front card body) */}
        {isFront && (
          <div className="absolute top-[68px] left-5 right-5 z-10 pointer-events-none flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Realistic Brushed Gold EMV Chip */}
              <div className="relative w-11 h-8 rounded-md bg-gradient-to-br from-[#FFE082] via-[#FFCA28] to-[#FFA000] border border-[#FFE57F]/90 shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden p-[2px] flex items-center justify-center">
                <div className="w-full h-full border border-black/20 rounded-[3px] grid grid-cols-3 grid-rows-2 gap-[1px] bg-amber-400/20">
                  <div className="border-r border-b border-black/15" />
                  <div className="border-r border-b border-black/15" />
                  <div className="border-b border-black/15" />
                  <div className="border-r border-black/15" />
                  <div className="border-r border-black/15" />
                  <div className="" />
                </div>
              </div>
              <Wifi className="w-4 h-4 rotate-90 opacity-60 drop-shadow-sm" />
            </div>

            {categoryMeta && (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 drop-shadow-sm flex items-center gap-1.5 opacity-95 shadow-xs">
                <CategoryIcon category={card.category} className="w-3.5 h-3.5" />
                <span>{categoryMeta.shortLabel}</span>
              </span>
            )}
          </div>
        )}

        {/* Card Bottom Area (Visible on the front card) */}
        {isFront && (
          <div
            style={{ color: fg }}
            className="absolute left-5 right-5 bottom-[18px] z-10 flex justify-between items-end pointer-events-none"
          >
            <div className="truncate pr-4">
              <b className="block text-[16px] font-bold tracking-wide uppercase truncate max-w-[200px] sm:max-w-[280px] drop-shadow-sm">
                {card.holder || 'Payment Card'}
              </b>
              {card.label && (
                <small className="block text-xs font-medium opacity-85 mt-0.5 truncate max-w-[180px] drop-shadow-sm">
                  {card.label}
                </small>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider bg-black/35 hover:bg-black/50 text-white px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md border border-white/20 transition-transform duration-200 group-hover:scale-105 active:scale-95">
                <QrCode className="w-3.5 h-3.5" />
                <span>Show QR</span>
              </span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
