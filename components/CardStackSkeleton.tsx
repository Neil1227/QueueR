'use client';

import React from 'react';

export function CardStackSkeleton() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col w-full max-w-lg mx-auto pb-[calc(100px+env(safe-area-inset-bottom,0px))] select-none animate-fade-in">
      {/* Skeleton Navigation Header */}
      <header className="px-5 pt-8 pb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[34px] font-bold tracking-tight text-text leading-tight">
            QueueR
          </h1>
          {/* Solid Filled Skeleton Pill for Card Count beside title */}
          <div className="h-5 w-16 bg-black/10 dark:bg-white/15 rounded-full animate-pulse shadow-xs" />
        </div>
        {/* Solid Filled Skeleton Circle for Settings Button */}
        <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 animate-pulse shadow-xs" />
      </header>

      {/* Skeleton Category Chips Bar */}
      <div className="px-5 pt-1 pb-2">
        <div className="flex items-center gap-2 py-1 overflow-x-hidden">
          {/* Active 'All' Chip Skeleton */}
          <div className="h-7.5 w-16 bg-black/20 dark:bg-white/20 rounded-full animate-pulse shadow-xs" />
          {/* Category Chip 2 Skeleton */}
          <div className="h-7.5 w-24 bg-black/5 dark:bg-white/10 rounded-full border border-black/5 dark:border-white/10 animate-pulse shadow-xs" />
          {/* Category Chip 3 Skeleton */}
          <div className="h-7.5 w-22 bg-black/5 dark:bg-white/10 rounded-full border border-black/5 dark:border-white/10 animate-pulse shadow-xs" />
          {/* Category Chip 4 Skeleton */}
          <div className="h-7.5 w-20 bg-black/5 dark:bg-white/10 rounded-full border border-black/5 dark:border-white/10 animate-pulse shadow-xs" />
        </div>
      </div>

      {/* Stacked Cards Area with Exact Matching Deck Geometry (56px peeking strips, rounded-[22px]) */}
      <main className="px-4 pt-3 flex-1">
        <div style={{ height: '322px' }} className="relative w-full">
          {/* Card 1 (Back-most peeking strip, translateY 0px) */}
          <div
            style={{
              transform: 'translate3d(0, 0px, 0) scale(0.96)',
              zIndex: 10,
            }}
            className="absolute top-0 left-0 right-0 origin-top h-[210px] rounded-[22px] bg-[#E2E2E6] dark:bg-[#1E1E22] shadow-[0_4px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] overflow-hidden border border-black/5 dark:border-white/5 animate-pulse"
          >
            <div className="h-[56px] flex items-center justify-between px-5 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/15" />
                <div className="h-4 w-20 bg-black/10 dark:bg-white/15 rounded-md" />
              </div>
              <div className="h-3.5 w-16 bg-black/5 dark:bg-white/10 rounded-md" />
            </div>
          </div>

          {/* Card 2 (Middle peeking strip, translateY 56px) */}
          <div
            style={{
              transform: 'translate3d(0, 56px, 0) scale(0.98)',
              zIndex: 20,
            }}
            className="absolute top-0 left-0 right-0 origin-top h-[210px] rounded-[22px] bg-[#D8D8DC] dark:bg-[#25252A] shadow-[0_8px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.45)] overflow-hidden border border-black/5 dark:border-white/10 animate-pulse"
          >
            <div className="h-[56px] flex items-center justify-between px-5 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black/15 dark:bg-white/20" />
                <div className="h-4 w-24 bg-black/15 dark:bg-white/20 rounded-md" />
              </div>
              <div className="h-3.5 w-16 bg-black/10 dark:bg-white/15 rounded-md" />
            </div>
          </div>

          {/* Card 3 (Front card, translateY 112px) */}
          <div
            style={{
              transform: 'translate3d(0, 112px, 0) scale(1)',
              zIndex: 30,
            }}
            className="absolute top-0 left-0 right-0 origin-top h-[210px] rounded-[22px] bg-[#CECED4] dark:bg-[#2C2C33] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] overflow-hidden border border-black/5 dark:border-white/15 p-0 flex flex-col justify-between"
          >
            {/* Front Card Top Preview Strip */}
            <div className="h-[56px] flex items-center justify-between px-5 border-b border-black/5 dark:border-white/10 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-black/20 dark:bg-white/25" />
                <div className="h-4 w-28 bg-black/20 dark:bg-white/25 rounded-md" />
              </div>
              <div className="h-3.5 w-20 bg-black/15 dark:bg-white/20 rounded-md" />
            </div>

            {/* Front Card EMV Chip area */}
            <div className="px-5 pt-3 flex items-center justify-between animate-pulse">
              <div className="w-10 h-7 rounded-md bg-amber-400/30 border border-amber-400/40" />
              <div className="h-5 w-16 rounded-full bg-black/5 dark:bg-white/10" />
            </div>

            {/* Front Card Bottom Holder Name */}
            <div className="px-5 pb-4 flex justify-between items-end animate-pulse">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-black/20 dark:bg-white/25 rounded-md" />
                <div className="h-3 w-20 bg-black/10 dark:bg-white/15 rounded-md" />
              </div>
              <div className="h-7 w-20 rounded-full bg-black/15 dark:bg-white/10 border border-black/10 dark:border-white/15" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
