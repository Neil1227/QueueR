'use client';

import React from 'react';

export function CardStackSkeleton() {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-lg mx-auto pb-[calc(100px+env(safe-area-inset-bottom,0px))] px-5 animate-pulse select-none">
      {/* Skeleton Navigation Header */}
      <header className="pt-8 pb-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <div className="h-9 w-32 bg-line/50 dark:bg-white/10 rounded-2xl" />
          <div className="h-4 w-14 bg-line/30 dark:bg-white/5 rounded-full" />
        </div>
        <div className="w-10 h-10 rounded-full bg-line/40 dark:bg-white/10" />
      </header>

      {/* Skeleton Category Chips */}
      <div className="flex items-center gap-2 py-3 overflow-x-hidden">
        <div className="h-8 w-14 bg-line/50 dark:bg-white/10 rounded-full shrink-0" />
        <div className="h-8 w-24 bg-line/30 dark:bg-white/5 rounded-full shrink-0" />
        <div className="h-8 w-24 bg-line/30 dark:bg-white/5 rounded-full shrink-0" />
        <div className="h-8 w-20 bg-line/30 dark:bg-white/5 rounded-full shrink-0" />
      </div>

      {/* Stacked Cards Skeleton */}
      <div className="relative mt-3 space-y-[-135px] pt-2">
        {/* Card 1 */}
        <div className="w-full h-52 rounded-3xl bg-surface dark:bg-[#1E1E22] border border-line/40 p-5 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-line/50 dark:bg-white/15" />
            <div className="h-4 w-20 bg-line/40 dark:bg-white/10 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-40 bg-line/50 dark:bg-white/15 rounded-lg" />
            <div className="h-3.5 w-24 bg-line/30 dark:bg-white/10 rounded-md" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="w-full h-52 rounded-3xl bg-surface/90 dark:bg-[#1A1A1E] border border-line/40 p-5 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-line/50 dark:bg-white/15" />
            <div className="h-4 w-20 bg-line/40 dark:bg-white/10 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-36 bg-line/50 dark:bg-white/15 rounded-lg" />
            <div className="h-3.5 w-28 bg-line/30 dark:bg-white/10 rounded-md" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="w-full h-52 rounded-3xl bg-surface/80 dark:bg-[#16161A] border border-line/40 p-5 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-line/50 dark:bg-white/15" />
            <div className="h-4 w-20 bg-line/40 dark:bg-white/10 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-44 bg-line/50 dark:bg-white/15 rounded-lg" />
            <div className="h-3.5 w-20 bg-line/30 dark:bg-white/10 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
