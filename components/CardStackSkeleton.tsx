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
          <div className="h-5 w-16 bg-neutral-200/90 dark:bg-neutral-700/60 rounded-full animate-pulse shadow-xs" />
        </div>
        {/* Solid Filled Skeleton Circle for Settings Button */}
        <div className="w-10 h-10 rounded-full bg-neutral-200/70 dark:bg-neutral-700/50 border border-neutral-300/40 dark:border-neutral-600/30 animate-pulse shadow-xs" />
      </header>

      {/* Skeleton Category Chips Bar */}
      <div className="px-5 pt-1 pb-2">
        <div className="flex items-center gap-2 py-1 overflow-x-hidden">
          {/* Active 'All' Chip Skeleton */}
          <div className="h-7.5 w-16 bg-neutral-300/80 dark:bg-neutral-600/70 rounded-full animate-pulse shadow-xs" />
          {/* Category Chip 2 Skeleton */}
          <div className="h-7.5 w-24 bg-neutral-200/70 dark:bg-neutral-700/50 rounded-full border border-neutral-300/30 dark:border-neutral-600/30 animate-pulse shadow-xs" />
          {/* Category Chip 3 Skeleton */}
          <div className="h-7.5 w-22 bg-neutral-200/70 dark:bg-neutral-700/50 rounded-full border border-neutral-300/30 dark:border-neutral-600/30 animate-pulse shadow-xs" />
          {/* Category Chip 4 Skeleton */}
          <div className="h-7.5 w-20 bg-neutral-200/70 dark:bg-neutral-700/50 rounded-full border border-neutral-300/30 dark:border-neutral-600/30 animate-pulse shadow-xs" />
        </div>
      </div>

      {/* Stacked Cards Area with Matching Deck Geometry (56px peeking strips, rounded-[22px]) */}
      <main className="px-4 pt-3 flex-1">
        <div style={{ height: '322px' }} className="relative w-full">
          {/* Card 1 (Back-most peeking strip, translateY 0px) */}
          <div
            style={{
              transform: 'translate3d(0, 0px, 0) scale(0.96)',
              zIndex: 10,
            }}
            className="absolute top-0 left-0 right-0 origin-top h-[210px] rounded-[22px] bg-[#EEEEF2] dark:bg-[#34343A] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] overflow-hidden border border-neutral-200/60 dark:border-neutral-700/60 animate-pulse"
          >
            <div className="h-[56px] flex items-center justify-between px-5 border-b border-neutral-200/60 dark:border-neutral-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-300/70 dark:bg-neutral-600/60" />
                <div className="h-4 w-20 bg-neutral-300/70 dark:bg-neutral-600/60 rounded-md" />
              </div>
              <div className="h-3.5 w-16 bg-neutral-300/40 dark:bg-neutral-600/30 rounded-md" />
            </div>
          </div>

          {/* Card 2 (Middle peeking strip, translateY 56px) */}
          <div
            style={{
              transform: 'translate3d(0, 56px, 0) scale(0.98)',
              zIndex: 20,
            }}
            className="absolute top-0 left-0 right-0 origin-top h-[210px] rounded-[22px] bg-[#E6E6EB] dark:bg-[#3B3B42] shadow-[0_8px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)] overflow-hidden border border-neutral-200/70 dark:border-neutral-700/60 animate-pulse"
          >
            <div className="h-[56px] flex items-center justify-between px-5 border-b border-neutral-200/70 dark:border-neutral-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-300/80 dark:bg-neutral-600/70" />
                <div className="h-4 w-24 bg-neutral-300/80 dark:bg-neutral-600/70 rounded-md" />
              </div>
              <div className="h-3.5 w-16 bg-neutral-300/50 dark:bg-neutral-600/40 rounded-md" />
            </div>
          </div>

          {/* Card 3 (Front card, translateY 112px) */}
          <div
            style={{
              transform: 'translate3d(0, 112px, 0) scale(1)',
              zIndex: 30,
            }}
            className="absolute top-0 left-0 right-0 origin-top h-[210px] rounded-[22px] bg-[#DFDFE5] dark:bg-[#43434B] shadow-[0_16px_36px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.45)] overflow-hidden border border-neutral-200/80 dark:border-neutral-700/70 p-0 flex flex-col justify-between"
          >
            {/* Front Card Top Preview Strip */}
            <div className="h-[56px] flex items-center justify-between px-5 border-b border-neutral-200/70 dark:border-neutral-700/50 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-300/90 dark:bg-neutral-600/80" />
                <div className="h-4 w-28 bg-neutral-300/90 dark:bg-neutral-600/80 rounded-md" />
              </div>
              <div className="h-3.5 w-20 bg-neutral-300/60 dark:bg-neutral-600/50 rounded-md" />
            </div>

            {/* Front Card EMV Chip area - generic neutral gray */}
            <div className="px-5 pt-3 flex items-center justify-between animate-pulse">
              <div className="w-10 h-7 rounded-md bg-neutral-300/80 dark:bg-neutral-600/70 border border-neutral-300/50 dark:border-neutral-600/40" />
              <div className="h-5 w-16 rounded-full bg-neutral-300/50 dark:bg-neutral-600/40" />
            </div>

            {/* Front Card Bottom Holder Name */}
            <div className="px-5 pb-4 flex justify-between items-end animate-pulse">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-neutral-300/90 dark:bg-neutral-600/80 rounded-md" />
                <div className="h-3 w-20 bg-neutral-300/50 dark:bg-neutral-600/40 rounded-md" />
              </div>
              <div className="h-7 w-20 rounded-full bg-neutral-300/70 dark:bg-neutral-600/60 border border-neutral-300/40 dark:border-neutral-600/30" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
