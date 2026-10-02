'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { isStandalone } from '@/lib/firebase';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do not show banner if already running in standalone PWA mode
    if (isStandalone()) {
      return;
    }

    // Check if dismissed recently in this session
    const isDismissed = sessionStorage.getItem('queuer_pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for Chromium PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsVisible(false);
      sessionStorage.setItem('queuer_pwa_banner_dismissed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // If on mobile browser (iOS or Android without immediate beforeinstallprompt), show banner after 1.5s
    const timer = setTimeout(() => {
      if (!isStandalone() && !sessionStorage.getItem('queuer_pwa_banner_dismissed')) {
        setIsVisible(true);
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
          sessionStorage.setItem('queuer_pwa_banner_dismissed', 'true');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      setShowAndroidInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSInstructions(false);
    setShowAndroidInstructions(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('queuer_pwa_banner_dismissed', 'true');
    }
  };

  if (!isVisible && !showIOSInstructions && !showAndroidInstructions) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Install Banner (Safe-area aware & non-intrusive) */}
      {isVisible && !showIOSInstructions && !showAndroidInstructions && (
        <aside
          aria-label="Install App Banner"
          className="fixed left-0 right-0 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] z-40 px-3.5 max-w-md mx-auto pointer-events-none animate-slide-up"
        >
          <div className="bg-surface/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-line/60 dark:border-white/10 p-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.22)] flex items-center justify-between gap-2.5 pointer-events-auto w-full">
            {/* App Icon & Details */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white shadow-sm shrink-0">
                <QrCode className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-text truncate leading-tight">
                  Add QueueR to Home Screen
                </h4>
                <p className="text-[10.5px] text-muted truncate leading-tight mt-0.5">
                  {isIOS ? '1-tap fast access & Apple Wallet style' : 'Fast 1-tap offline payment cards'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-accent text-white font-bold text-xs shadow-sm hover:bg-accent/90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'Add' : 'Install'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss install banner"
                className="p-1 rounded-lg text-muted hover:text-text hover:bg-bg/80 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* iOS Safari Step-by-Step Instructions Modal */}
      {showIOSInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add to iOS Home Screen"
          className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-md flex flex-col justify-end p-4 pb-[calc(18px+env(safe-area-inset-bottom,0px))] animate-fade-in"
        >
          <div className="bg-surface dark:bg-[#1C1C1E] border border-line/60 dark:border-white/10 p-5 rounded-3xl shadow-2xl max-w-sm mx-auto w-full space-y-4 animate-slide-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white shadow-sm">
                  <QrCode className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">Install on iOS Home Screen</h3>
                  <p className="text-[11px] text-muted">QueueR works best as a standalone app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-muted hover:text-text rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 bg-bg/60 p-3.5 rounded-2xl border border-line/30 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <p className="text-text leading-snug">
                  Tap the <strong className="font-semibold text-accent inline-flex items-center gap-0.5"><Share className="w-3.5 h-3.5 inline mx-0.5" /> Share</strong> button in your Safari toolbar below.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <p className="text-text leading-snug">
                  Scroll down and tap <strong className="font-semibold text-text inline-flex items-center gap-0.5"><PlusSquare className="w-3.5 h-3.5 inline mx-0.5" /> Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-accent flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <p className="text-text leading-snug">
                  Tap <strong className="font-semibold text-accent">Add</strong> in the top-right corner to finish.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl bg-accent text-white font-bold text-xs shadow-sm hover:bg-accent/90 active:scale-98 transition-all cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Android Manual Step-by-Step Instructions Modal */}
      {showAndroidInstructions && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add to Android Home Screen"
          className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-md flex flex-col justify-end p-4 pb-[calc(18px+env(safe-area-inset-bottom,0px))] animate-fade-in"
        >
          <div className="bg-surface dark:bg-[#1C1C1E] border border-line/60 dark:border-white/10 p-5 rounded-3xl shadow-2xl max-w-sm mx-auto w-full space-y-4 animate-slide-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white shadow-sm">
                  <QrCode className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">Install on Android</h3>
                  <p className="text-[11px] text-muted">Add QueueR to your app drawer & homescreen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-muted hover:text-text rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 bg-bg/60 p-3.5 rounded-2xl border border-line/30 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <p className="text-text leading-snug">
                  Tap the browser menu <strong className="font-semibold text-text">⋮ (three dots)</strong> in the top right.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <p className="text-text leading-snug">
                  Select <strong className="font-semibold text-accent inline-flex items-center gap-0.5"><Smartphone className="w-3.5 h-3.5 inline mx-0.5" /> Install app</strong> or <strong className="font-semibold text-text">Add to Home screen</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl bg-accent text-white font-bold text-xs shadow-sm hover:bg-accent/90 active:scale-98 transition-all cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
