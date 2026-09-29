'use client';

import React from 'react';
import { PROVIDERS } from '@/lib/providers';
import { BankLogo } from './BankLogo';

interface ProviderChipsProps {
  selectedPreset: string;
  onSelectPreset: (name: string, color: string) => void;
}

export function ProviderChips({ selectedPreset, onSelectPreset }: ProviderChipsProps) {
  return (
    <div
      role="group"
      aria-label="Select provider preset"
      className="flex gap-2 overflow-x-auto py-2 px-1 -mx-4 px-4 scrollbar-none snap-x"
    >
      {PROVIDERS.map(([name, color]) => {
        const isSelected = selectedPreset === name;
        return (
          <button
            key={name}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectPreset(name, color)}
            className={`flex-none flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer ${
              isSelected
                ? 'bg-surface text-text border-accent shadow-sm ring-1 ring-accent'
                : 'bg-surface text-text/80 border-transparent hover:border-line active:scale-95'
            }`}
          >
            {name === 'Custom' ? (
              <span
                className="w-4 h-4 rounded-full shadow-inner flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            ) : (
              <BankLogo provider={name} color={color} size={20} showBackground={true} />
            )}
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
}
