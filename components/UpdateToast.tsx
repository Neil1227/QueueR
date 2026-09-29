'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function UpdateToast() {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setShow(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShow(true);
            }
          });
        }
      });
    }).catch(() => {});
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed left-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 z-50 bg-[#1D1D1F] text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 border border-white/10 animate-fade-in">
      <span>Update available</span>
      <button
        type="button"
        onClick={handleUpdate}
        className="flex items-center gap-1 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-accent/90 active:scale-95 transition-all"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Refresh</span>
      </button>
    </div>
  );
}
