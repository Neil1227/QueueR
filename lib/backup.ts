/**
 * Encrypted Backup & Restore System:
 * - Client-side AES-GCM 256-bit encryption
 * - PBKDF2-SHA256 key derivation with 600,000 iterations
 * - Envelope format: { app: "qr-wallet", v: 1, kdf, iterations, salt, iv, data }
 * - Filename: qr-wallet-backup-YYYY-MM-DD.qrw
 * - Deduplicated card merging and passphrase strength evaluation
 */
import { Card, CardSchema } from './schema';
import { bufferToBase64, base64ToBuffer, generateSalt } from './crypto';

export const BACKUP_PBKDF2_ITERATIONS = 600000;
export const LAST_BACKUP_KEY = 'qr_wallet_last_backup_timestamp_v1';

export interface BackupEnvelope {
  app: 'qr-wallet';
  v: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string; // Base64
  iv: string; // Base64
  data: string; // Base64 ciphertext
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
}

/**
 * Calculates passphrase strength (min 10 chars required).
 */
export function evaluatePassphraseStrength(passphrase: string): PasswordStrength {
  if (!passphrase || passphrase.length < 10) {
    return { score: 0, label: 'Too short', color: '#AAAAAA' };
  }

  let score = 1;
  if (passphrase.length >= 14) score += 1;
  if (/[a-z]/.test(passphrase) && /[A-Z]/.test(passphrase)) score += 1;
  if (/\d/.test(passphrase)) score += 0.5;
  if (/[^a-zA-Z0-9]/.test(passphrase)) score += 0.5;

  const finalScore = Math.min(4, Math.floor(score));
  const labels: Array<PasswordStrength['label']> = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF'];

  return {
    score: finalScore,
    label: labels[finalScore],
    color: colors[finalScore],
  };
}

/**
 * Derives AES-GCM 256 key from passphrase and salt with 600,000 PBKDF2 iterations.
 */
async function deriveBackupKey(passphrase: string, saltBuffer: ArrayBuffer, iterations = BACKUP_PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Creates an encrypted backup file content for a given list of cards.
 */
export async function createEncryptedBackup(cards: Card[], passphrase: string): Promise<string> {
  if (!passphrase || passphrase.length < 10) {
    throw new Error('Passphrase must be at least 10 characters long');
  }

  const saltB64 = generateSalt(16);
  const saltBuf = base64ToBuffer(saltB64);
  const ivBuf = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveBackupKey(passphrase, saltBuf.buffer as ArrayBuffer, BACKUP_PBKDF2_ITERATIONS);

  const payloadJson = JSON.stringify({
    cards,
    exportedAt: new Date().toISOString(),
    cardCount: cards.length,
  });

  const enc = new TextEncoder();
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBuf.buffer as ArrayBuffer,
    },
    key,
    enc.encode(payloadJson)
  );

  const envelope: BackupEnvelope = {
    app: 'qr-wallet',
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: BACKUP_PBKDF2_ITERATIONS,
    salt: saltB64,
    iv: bufferToBase64(ivBuf),
    data: bufferToBase64(cipherBuffer),
  };

  // Record last backup timestamp
  setLastBackupDate(Date.now());

  return JSON.stringify(envelope, null, 2);
}

/**
 * Decrypts a .qrw backup file content. Throws descriptive error on wrong passphrase or corrupted file.
 */
export async function restoreEncryptedBackup(fileContent: string, passphrase: string): Promise<Card[]> {
  if (!passphrase) {
    throw new Error('Passphrase is required');
  }

  let envelope: BackupEnvelope;
  try {
    envelope = JSON.parse(fileContent);
  } catch {
    throw new Error('Invalid file format. Please select a valid .qrw backup file.');
  }

  if (envelope.app !== 'qr-wallet' || envelope.v !== 1 || !envelope.data || !envelope.salt || !envelope.iv) {
    throw new Error('Incompatible or invalid backup file structure.');
  }

  try {
    const saltBuf = base64ToBuffer(envelope.salt);
    const ivBuf = base64ToBuffer(envelope.iv);
    const cipherBuf = base64ToBuffer(envelope.data);

    const key = await deriveBackupKey(
      passphrase,
      saltBuf.buffer as ArrayBuffer,
      envelope.iterations || BACKUP_PBKDF2_ITERATIONS
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuf.buffer as ArrayBuffer,
      },
      key,
      cipherBuf.buffer as ArrayBuffer
    );

    const dec = new TextDecoder();
    const rawJson = dec.decode(decryptedBuffer);
    const parsed = JSON.parse(rawJson);

    if (!Array.isArray(parsed?.cards)) {
      throw new Error('No valid cards list found in backup data.');
    }

    // Validate each card with Zod
    const validatedCards: Card[] = [];
    for (const c of parsed.cards) {
      const result = CardSchema.safeParse(c);
      if (result.success) {
        validatedCards.push(result.data);
      }
    }

    return validatedCards;
  } catch (err: any) {
    if (err?.name === 'OperationError' || err?.message?.includes('operation failed')) {
      throw new Error('Incorrect passphrase. Decryption failed.');
    }
    throw new Error(err instanceof Error ? err.message : 'Failed to decrypt backup file');
  }
}

/**
 * Normalizes card identifier for duplicate checking (provider + number).
 */
export function normalizeCardKey(card: Pick<Card, 'provider' | 'number'>): string {
  const prov = (card.provider || '').trim().toLowerCase();
  const num = (card.number || '').replace(/\D/g, '');
  return `${prov}::${num}`;
}

/**
 * Merges imported cards into existing cards:
 * - Keeps existing cards
 * - Adds new cards
 * - Skips duplicates by matching normalized provider + account number
 */
export function mergeCards(existingCards: Card[], importedCards: Card[]): { merged: Card[]; addedCount: number; skippedCount: number } {
  const existingKeys = new Set(existingCards.map(normalizeCardKey));
  const newCardsToAdd: Card[] = [];
  let skippedCount = 0;

  for (const imported of importedCards) {
    const key = normalizeCardKey(imported);
    if (existingKeys.has(key)) {
      skippedCount++;
    } else {
      existingKeys.add(key);
      newCardsToAdd.push(imported);
    }
  }

  return {
    merged: [...existingCards, ...newCardsToAdd],
    addedCount: newCardsToAdd.length,
    skippedCount,
  };
}

/**
 * Generates formatted backup filename: qr-wallet-backup-YYYY-MM-DD.qrw
 */
export function generateBackupFilename(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `qr-wallet-backup-${yyyy}-${mm}-${dd}.qrw`;
}

export function getLastBackupDate(): number | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(LAST_BACKUP_KEY);
  return val ? parseInt(val, 10) || null : null;
}

export function setLastBackupDate(timestamp: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_BACKUP_KEY, String(timestamp));
}

/**
 * Checks if 30 days have passed since the last backup.
 */
export function isBackupReminderDue(): boolean {
  const last = getLastBackupDate();
  if (!last) return true;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - last > THIRTY_DAYS_MS;
}
