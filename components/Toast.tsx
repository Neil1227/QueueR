'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastContextValue {
  showToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setMessage(msg);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[calc(16px+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-[100] bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl pointer-events-none transition-all duration-300 animate-slide-down text-center max-w-[92vw] truncate border border-white/20 backdrop-blur-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
