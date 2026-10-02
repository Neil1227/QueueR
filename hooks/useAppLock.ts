'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  hasConfiguredPin,
  verifyPin,
  setPin,
  removePin,
  getLockTimeout,
  setLockTimeout,
  LockTimeoutOption,
  hasWebAuthn,
  hasConfiguredPasskey,
  registerPasskey,
  verifyPasskey,
  removePasskey,
  isBlurPrivacyEnabled,
  setBlurPrivacyEnabled,
  getLockoutRemainingSeconds,
  getFailedAttempts,
  VerifyPinResult,
  restorePinFromCloud,
} from '@/lib/app-lock';
import { getUserMeta, saveUserPin, isLocalOfflineUser } from '@/lib/firebase';

export function useAppLock(userId?: string | null) {
  const [hasPinState, setHasPinState] = useState(() => {
    if (typeof window !== 'undefined') return hasConfiguredPin();
    return true;
  });
  const [hasPasskeyState, setHasPasskeyState] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeoutState, setLockTimeoutState] = useState<LockTimeoutOption>(0);
  const [blurPrivacyState, setBlurPrivacyState] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const backgroundTimeRef = useRef<number | null>(null);

  // Synchronize on mount and handle biometric detection + cloud PIN auto-restore
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const passkeyExists = hasConfiguredPasskey();
    const timeout = getLockTimeout();
    const blur = isBlurPrivacyEnabled();
    const bioSupported = hasWebAuthn();
    const remaining = getLockoutRemainingSeconds();

    setHasPasskeyState(passkeyExists);
    setLockTimeoutState(timeout);
    setBlurPrivacyState(blur);
    setIsBiometricSupported(bioSupported);
    setLockoutSeconds(remaining);

    let isMounted = true;
    (async () => {
      let pinExists = hasConfiguredPin();
      if (!pinExists && userId && !isLocalOfflineUser(userId)) {
        try {
          const meta = await getUserMeta(userId);
          if (meta?.pinHash && meta?.pinSalt) {
            restorePinFromCloud(meta.pinHash, meta.pinSalt);
            pinExists = true;
          }
        } catch (err) {
          console.warn('Error fetching cloud PIN in useAppLock:', err);
        }
      }

      if (!isMounted) return;
      setHasPinState(pinExists);

      // Lock on launch/reopen if security is enabled and session is not active
      if (pinExists || passkeyExists) {
        const isSessionActive = sessionStorage.getItem('qr_wallet_session_active') === 'true';
        if (!isSessionActive) {
          setIsLocked(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Background timer listener for configurable auto-lock timeout
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      const securityEnabled = hasPinState || hasPasskeyState;
      if (!securityEnabled) return;

      if (document.visibilityState === 'hidden') {
        backgroundTimeRef.current = Date.now();
        // Immediately trigger lock overlay state if timeout is 0 (immediate)
        if (lockTimeoutState === 0) {
          setIsLocked(true);
        }
      } else if (document.visibilityState === 'visible') {
        const bgTime = backgroundTimeRef.current;
        if (bgTime) {
          const elapsedSec = (Date.now() - bgTime) / 1000;
          if (elapsedSec >= lockTimeoutState) {
            setIsLocked(true);
          }
        }
        // Update lockout state on foreground
        setLockoutSeconds(getLockoutRemainingSeconds());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasPinState, hasPasskeyState, lockTimeoutState]);

  const unlockWithPin = useCallback(async (pin: string): Promise<VerifyPinResult> => {
    const result = await verifyPin(pin);
    if (result.success) {
      setIsLocked(false);
      setLockoutSeconds(0);
    } else if (result.isLockedOut) {
      setLockoutSeconds(result.remainingLockoutSeconds);
    }
    return result;
  }, []);

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const valid = await verifyPasskey();
    if (valid) {
      setIsLocked(false);
      setLockoutSeconds(0);
      return true;
    }
    return false;
  }, []);

  const updatePin = useCallback(async (pin: string | null) => {
    if (pin) {
      const { hash, salt } = await setPin(pin);
      setHasPinState(true);
      if (userId && !isLocalOfflineUser(userId)) {
        try {
          await saveUserPin(userId, hash, salt);
        } catch (err) {
          console.warn('Failed to save updated PIN to cloud:', err);
        }
      }
    } else {
      removePin();
      setHasPinState(false);
      setIsLocked(false);
    }
  }, [userId]);

  const togglePasskey = useCallback(async (enable: boolean) => {
    if (enable) {
      const ok = await registerPasskey();
      if (ok) setHasPasskeyState(true);
      return ok;
    } else {
      removePasskey();
      setHasPasskeyState(false);
      return true;
    }
  }, []);

  const updateLockTimeoutOption = useCallback((timeout: LockTimeoutOption) => {
    setLockTimeout(timeout);
    setLockTimeoutState(timeout);
  }, []);

  const toggleBlurPrivacy = useCallback((enable: boolean) => {
    setBlurPrivacyEnabled(enable);
    setBlurPrivacyState(enable);
  }, []);

  const lockManually = useCallback(() => {
    if (hasPinState || hasPasskeyState) {
      setIsLocked(true);
    }
  }, [hasPinState, hasPasskeyState]);

  return {
    isLocked,
    hasPin: hasPinState,
    hasPasskey: hasPasskeyState,
    lockTimeout: lockTimeoutState,
    blurPrivacy: blurPrivacyState,
    isBiometricSupported,
    lockoutSeconds,
    failedAttempts: getFailedAttempts(),
    unlockWithPin,
    unlockWithBiometrics,
    updatePin,
    togglePasskey,
    updateLockTimeout: updateLockTimeoutOption,
    toggleBlurPrivacy,
    lockManually,
  };
}
