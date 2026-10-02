'use client';

import React, { useState, useEffect } from 'react';
import { findBankBrand, getBankLogoUrl, getBackupLogoUrl, getProviderInitials } from '@/lib/bank-logos';

interface BankLogoProps {
  provider: string;
  customLogo?: string | null;
  color?: string;
  size?: number;
  className?: string;
  showBackground?: boolean;
  alt?: string;
}

export function BankLogo({
  provider,
  color,
  size = 28,
  className = '',
  showBackground = true,
  alt,
}: BankLogoProps) {
  const brand = findBankBrand(provider);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [triedBackup, setTriedBackup] = useState(false);

  // Generate clean initials monogram for provider (e.g. PayMaya -> PM, GCash -> GC, BPI -> BPI)
  const initialText = getProviderInitials(provider);
  const brandColor = color || brand?.color || '#007AFF';

  // Compute logo image source from official bank brand domain if known
  useEffect(() => {
    setHasError(false);
    setTriedBackup(false);

    if (brand?.domain) {
      setImgSrc(getBankLogoUrl(brand.domain, 128));
    } else {
      setImgSrc(null);
    }
  }, [provider, brand?.domain]);

  const handleError = () => {
    if (!triedBackup && brand?.domain) {
      setTriedBackup(true);
      setImgSrc(getBackupLogoUrl(brand.domain));
    } else {
      setHasError(true);
    }
  };

  const badgeSizeStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  const accessibleAlt = alt || `${provider || 'Bank'} logo`;

  return (
    <div
      style={badgeSizeStyle}
      className={`relative inline-flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden select-none transition-transform duration-200 ${
        showBackground
          ? 'bg-white shadow-[0_1.5px_4px_rgba(0,0,0,0.18)] border border-white/40 ring-1 ring-black/5'
          : ''
      } ${className}`}
      aria-hidden={!alt}
    >
      {imgSrc && !hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={accessibleAlt}
          onError={handleError}
          className="w-full h-full object-contain p-[2px] rounded-full transition-opacity duration-200"
          loading="lazy"
          crossOrigin="anonymous"
        />
      ) : (
        <span
          style={{
            backgroundColor: brandColor,
            color: '#FFFFFF',
            fontSize: `${Math.max(9, Math.floor(size * (initialText.length > 2 ? 0.32 : 0.38)))}px`,
          }}
          className="w-full h-full flex items-center justify-center font-bold tracking-tight uppercase select-none rounded-full shadow-inner"
        >
          {initialText}
        </span>
      )}
    </div>
  );
}

