/**
 * App Lock & Security: PIN protection (PBKDF2 SHA-256 >= 310,000 iterations),
 * WebAuthn biometric passkeys, lockout progression, auto-lock timeouts, and blur privacy.
 */
import { bufferToBase64, base64ToBuffer, generateSalt } from './crypto';

const PIN_HASH_KEY = 'qr_wallet_pin_hash_v1';
const PIN_SALT_KEY = 'qr_wallet_pin_salt_v1';
const PIN_EMAIL_KEY = 'qr_wallet_pin_email_v1';
const PASSKEY_CRED_ID_KEY = 'qr_wallet_passkey_cred_id_v1';
const AUTO_LOCK_KEY = 'qr_wallet_autolock_enabled_v1';
const LOCK_TIMEOUT_KEY = 'qr_wallet_lock_timeout_seconds_v1'; // 0, 30, 60, 300
const FAILED_ATTEMPTS_KEY = 'qr_wallet_pin_failed_attempts_v1';
const LOCKOUT_UNTIL_KEY = 'qr_wallet_pin_lockout_until_v1';
const BLUR_PRIVACY_KEY = 'qr_wallet_blur_privacy_v1';

export const PBKDF2_PIN_ITERATIONS = 310000;

export type LockTimeoutOption = 0 | 30 | 60 | 300; // 0 = Immediately

export interface VerifyPinResult {
  success: boolean;
  isLockedOut: boolean;
  remainingLockoutSeconds: number;
  attemptsCount: number;
}

/**
 * Derives a PBKDF2 SHA-256 hash using 310,000 iterations and a cryptographically random salt.
 */
export async function hashPin(pin: string, saltB64: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = base64ToBuffer(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_PIN_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToBase64(derivedBits);
}

export function hasConfiguredPin(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(PIN_HASH_KEY));
}

export function getPinEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PIN_EMAIL_KEY);
}

export async function setPin(pin: string, email?: string | null): Promise<void> {
  if (typeof window === 'undefined') return;
  const salt = generateSalt(16);
  const hash = await hashPin(pin, salt);
  localStorage.setItem(PIN_SALT_KEY, salt);
  localStorage.setItem(PIN_HASH_KEY, hash);
  if (email) {
    localStorage.setItem(PIN_EMAIL_KEY, email);
  }
  resetLockout();
}

export function getFailedAttempts(): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(FAILED_ATTEMPTS_KEY);
  return val ? parseInt(val, 10) || 0 : 0;
}

export function getLockoutRemainingSeconds(): number {
  if (typeof window === 'undefined') return 0;
  const until = localStorage.getItem(LOCKOUT_UNTIL_KEY);
  if (!until) return 0;
  const untilMs = parseInt(until, 10) || 0;
  const remaining = Math.ceil((untilMs - Date.now()) / 1000);
  return Math.max(0, remaining);
}

export function resetLockout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  localStorage.removeItem(LOCKOUT_UNTIL_KEY);
}

/**
 * Computes lockout delay based on failed attempt count:
 * - 5th failure: 30 seconds
 * - 6th failure: 60 seconds (1 min)
 * - 7+ failures: 300 seconds (5 min)
 */
export function calculateLockoutDelaySeconds(failedCount: number): number {
  if (failedCount < 5) return 0;
  if (failedCount === 5) return 30;
  if (failedCount === 6) return 60;
  return 300;
}

export async function verifyPin(pin: string): Promise<VerifyPinResult> {
  if (typeof window === 'undefined') {
    return { success: false, isLockedOut: false, remainingLockoutSeconds: 0, attemptsCount: 0 };
  }

  // Check if currently locked out
  const remaining = getLockoutRemainingSeconds();
  if (remaining > 0) {
    return {
      success: false,
      isLockedOut: true,
      remainingLockoutSeconds: remaining,
      attemptsCount: getFailedAttempts(),
    };
  }

  const storedHash = localStorage.getItem(PIN_HASH_KEY);
  const storedSalt = localStorage.getItem(PIN_SALT_KEY);
  if (!storedHash || !storedSalt) {
    return { success: true, isLockedOut: false, remainingLockoutSeconds: 0, attemptsCount: 0 };
  }

  const hash = await hashPin(pin, storedSalt);
  if (hash === storedHash) {
    resetLockout();
    return { success: true, isLockedOut: false, remainingLockoutSeconds: 0, attemptsCount: 0 };
  }

  // Failed attempt
  const nextCount = getFailedAttempts() + 1;
  localStorage.setItem(FAILED_ATTEMPTS_KEY, String(nextCount));

  const lockoutDelay = calculateLockoutDelaySeconds(nextCount);
  if (lockoutDelay > 0) {
    const lockoutUntil = Date.now() + lockoutDelay * 1000;
    localStorage.setItem(LOCKOUT_UNTIL_KEY, String(lockoutUntil));
    return {
      success: false,
      isLockedOut: true,
      remainingLockoutSeconds: lockoutDelay,
      attemptsCount: nextCount,
    };
  }

  return {
    success: false,
    isLockedOut: false,
    remainingLockoutSeconds: 0,
    attemptsCount: nextCount,
  };
}

export function removePin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PIN_HASH_KEY);
  localStorage.removeItem(PIN_SALT_KEY);
  localStorage.removeItem(PIN_EMAIL_KEY);
  resetLockout();
}

export function getLockTimeout(): LockTimeoutOption {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(LOCK_TIMEOUT_KEY);
  if (val === '30' || val === '60' || val === '300') {
    return parseInt(val, 10) as LockTimeoutOption;
  }
  return 0; // Default Immediately
}

export function setLockTimeout(timeout: LockTimeoutOption): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCK_TIMEOUT_KEY, String(timeout));
}

export function isAutoLockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTO_LOCK_KEY) === 'true';
}

export function setAutoLockEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTO_LOCK_KEY, enabled ? 'true' : 'false');
}

export function isBlurPrivacyEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(BLUR_PRIVACY_KEY) === 'true';
}

export function setBlurPrivacyEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BLUR_PRIVACY_KEY, enabled ? 'true' : 'false');
}

export function hasWebAuthn(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.PublicKeyCredential && typeof navigator.credentials?.create === 'function');
}

export function hasConfiguredPasskey(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(PASSKEY_CRED_ID_KEY));
}

export async function registerPasskey(userName = 'QueueR User'): Promise<boolean> {
  if (!hasWebAuthn()) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        rp: { name: 'QueueR' },
        user: {
          id: userId.buffer as ArrayBuffer,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (credential) {
      localStorage.setItem(PASSKEY_CRED_ID_KEY, credential.id);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function verifyPasskey(): Promise<boolean> {
  if (!hasWebAuthn()) return false;
  const credId = localStorage.getItem(PASSKEY_CRED_ID_KEY);
  if (!credId) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge.buffer as ArrayBuffer,
        timeout: 60000,
        userVerification: 'preferred',
      },
    });
    if (assertion) {
      resetLockout();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function removePasskey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PASSKEY_CRED_ID_KEY);
}
