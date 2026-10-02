'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

const PULL_THRESHOLD = 68; // px to trigger refresh
const MAX_PULL = 90; // max visual displacement

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasHapticFired, setHasHapticFired] = useState(false);

  const startYRef = useRef(0);
  const isTrackingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY <= 2) {
      startYRef.current = e.touches[0].clientY;
      isTrackingRef.current = true;
      setHasHapticFired(false);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isTrackingRef.current || disabled || isRefreshing) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > 2) {
      isTrackingRef.current = false;
      setPullY(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Natural logarithmic damping
      const distance = Math.min(MAX_PULL, Math.pow(diff, 0.82) * 2.2);
      setPullY(distance);

      if (distance >= PULL_THRESHOLD && !hasHapticFired) {
        setHasHapticFired(true);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            // Ignore vibration error
          }
        }
      } else if (distance < PULL_THRESHOLD && hasHapticFired) {
        setHasHapticFired(false);
      }
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isTrackingRef.current || disabled) return;
    isTrackingRef.current = false;

    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(48); // Lock at active loading position

      try {
        if (onRefresh) {
          await onRefresh();
        } else if (typeof window !== 'undefined') {
          // Default: reload page cleanly
          await new Promise((res) => setTimeout(res, 350));
          window.location.reload();
          return;
        }
      } catch (err) {
        console.error('Pull-to-refresh error:', err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 500);
      }
    } else {
      setPullY(0);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullY, hasHapticFired]);

  const progress = Math.min(1, pullY / PULL_THRESHOLD);
  const isReady = pullY >= PULL_THRESHOLD;

  return (
    <div ref={containerRef} className="relative min-h-screen w-full">
      {/* Floating Refresh Status Pill */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 ${
          pullY > 10 || isRefreshing ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{
          transform: `translate(-50%, ${Math.max(0, pullY - 24)}px)`,
        }}
      >
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface/90 dark:bg-[#1D1D1F]/90 backdrop-blur-xl border border-line/50 text-text shadow-lg text-xs font-semibold">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-accent animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : isReady ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-accent rotate-180 transition-transform" />
              <span>Release to refresh</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-3.5 h-3.5 text-muted transition-transform"
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                }}
              />
              <span className="text-muted">Pull down to refresh</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content with Elastic Offset */}
      <div
        style={{
          transform: pullY > 0 ? `translateY(${pullY}px)` : undefined,
          transition: isTrackingRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
