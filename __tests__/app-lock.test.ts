import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setPin,
  verifyPin,
  hasConfiguredPin,
  removePin,
  calculateLockoutDelaySeconds,
  resetLockout,
  getLockoutRemainingSeconds,
  isBlurPrivacyEnabled,
  setBlurPrivacyEnabled,
  getLockTimeout,
  setLockTimeout,
  PBKDF2_PIN_ITERATIONS,
} from '../lib/app-lock';

describe('App Lock & Security', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLockout();
  });

  it('uses at least 310,000 PBKDF2 iterations', () => {
    expect(PBKDF2_PIN_ITERATIONS).toBeGreaterThanOrEqual(310000);
  });

  it('sets and verifies PIN correctly with optional email association', async () => {
    expect(hasConfiguredPin()).toBe(false);
    await setPin('1234', 'user@gmail.com');
    expect(hasConfiguredPin()).toBe(true);

    const valid = await verifyPin('1234');
    expect(valid.success).toBe(true);
    expect(valid.isLockedOut).toBe(false);

    const invalid = await verifyPin('9999');
    expect(invalid.success).toBe(false);
  });

  it('progresses lockout delays after multiple failed attempts', () => {
    expect(calculateLockoutDelaySeconds(1)).toBe(0);
    expect(calculateLockoutDelaySeconds(4)).toBe(0);
    expect(calculateLockoutDelaySeconds(5)).toBe(30);
    expect(calculateLockoutDelaySeconds(6)).toBe(60);
    expect(calculateLockoutDelaySeconds(7)).toBe(300);
    expect(calculateLockoutDelaySeconds(10)).toBe(300);
  });

  it('triggers lockout state on 5 consecutive failed PIN attempts', async () => {
    await setPin('5555');

    for (let i = 1; i <= 4; i++) {
      const res = await verifyPin('0000');
      expect(res.success).toBe(false);
      expect(res.isLockedOut).toBe(false);
      expect(res.attemptsCount).toBe(i);
    }

    // 5th attempt -> triggers 30s lockout
    const fifth = await verifyPin('0000');
    expect(fifth.success).toBe(false);
    expect(fifth.isLockedOut).toBe(true);
    expect(fifth.remainingLockoutSeconds).toBeGreaterThanOrEqual(29);
    expect(getLockoutRemainingSeconds()).toBeGreaterThan(0);
  });

  it('clears PIN and resets lockout on removePin', async () => {
    await setPin('4321');
    expect(hasConfiguredPin()).toBe(true);
    removePin();
    expect(hasConfiguredPin()).toBe(false);
    expect(getLockoutRemainingSeconds()).toBe(0);
  });

  it('manages auto-lock timeout and blur privacy preferences', () => {
    expect(getLockTimeout()).toBe(0);
    setLockTimeout(60);
    expect(getLockTimeout()).toBe(60);

    expect(isBlurPrivacyEnabled()).toBe(false);
    setBlurPrivacyEnabled(true);
    expect(isBlurPrivacyEnabled()).toBe(true);
  });
});
