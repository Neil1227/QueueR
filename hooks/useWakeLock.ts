'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const shouldLockRef = useRef(false);

  const requestLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!wakeLockRef.current || wakeLockRef.current.released) {
        const sentinel = await navigator.wakeLock.request('screen');
        wakeLockRef.current = sentinel;
        setIsLocked(true);
        sentinel.addEventListener('release', () => {
          setIsLocked(false);
        });
      }
    } catch {
      setIsLocked(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    shouldLockRef.current = false;
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore release error
      }
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  const acquire = useCallback(() => {
    shouldLockRef.current = true;
    requestLock();
  }, [requestLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldLockRef.current) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [requestLock, releaseLock]);

  return { isLocked, acquire, release: releaseLock };
}
