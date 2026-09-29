'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastContextValue {
  showToast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] -translate-x-1/2 z-50 bg-[#1D1D1F] text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg pointer-events-none transition-all duration-200 animate-fade-in text-center max-w-[90vw] truncate border border-white/10"
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
