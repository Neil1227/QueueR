import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluatePassphraseStrength,
  createEncryptedBackup,
  restoreEncryptedBackup,
  mergeCards,
  normalizeCardKey,
  BACKUP_PBKDF2_ITERATIONS,
} from '../lib/backup';
import { Card } from '../lib/schema';

describe('Encrypted Backup & Restore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleCards: Card[] = [
    {
      id: 'c1',
      provider: 'GCash',
      color: '#007DFE',
      holder: 'Juan Dela Cruz',
      number: '0917 123 4567',
      label: 'Personal',
      category: 'personal',
      payload: 'https://qr.gcash.com/pay1',
      isDefault: true,
      useCount: 5,
      lastUsedAt: 1000,
      createdAt: 1000,
      updatedAt: 1000,
      v: 1,
    },
    {
      id: 'c2',
      provider: 'Maya',
      color: '#1FBF6B',
      holder: 'Maria Santos',
      number: '0918 987 6543',
      label: 'Store',
      category: 'business',
      payload: 'https://qr.maya.ph/pay2',
      isDefault: false,
      useCount: 2,
      lastUsedAt: 500,
      createdAt: 500,
      updatedAt: 500,
      v: 1,
    },
  ];

  it('uses at least 600,000 PBKDF2 iterations for backup encryption', () => {
    expect(BACKUP_PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600000);
  });

  describe('evaluatePassphraseStrength', () => {
    it('marks passphrases under 10 chars as Too short', () => {
      expect(evaluatePassphraseStrength('abc').label).toBe('Too short');
      expect(evaluatePassphraseStrength('123456789').label).toBe('Too short');
    });

    it('rates stronger passphrases accurately', () => {
      const strong = evaluatePassphraseStrength('Correct-Horse-Battery-99!');
      expect(strong.score).toBeGreaterThanOrEqual(3);
    });
  });

  describe('createEncryptedBackup and restoreEncryptedBackup', () => {
    const passphrase = 'MySuperSecretPassphrase2026!';

    it('successfully encrypts and restores card data', async () => {
      const encryptedJson = await createEncryptedBackup(sampleCards, passphrase);
      expect(typeof encryptedJson).toBe('string');

      const envelope = JSON.parse(encryptedJson);
      expect(envelope.app).toBe('qr-wallet');
      expect(envelope.v).toBe(1);
      expect(envelope.kdf).toBe('PBKDF2-SHA256');
      expect(envelope.iterations).toBe(BACKUP_PBKDF2_ITERATIONS);
      expect(envelope.data).toBeDefined();

      // Ensure raw plaintext is NOT visible in ciphertext
      expect(encryptedJson).not.toContain('Juan Dela Cruz');
      expect(encryptedJson).not.toContain('0917 123 4567');

      // Decrypt
      const decrypted = await restoreEncryptedBackup(encryptedJson, passphrase);
      expect(decrypted.length).toBe(2);
      expect(decrypted[0].provider).toBe('GCash');
      expect(decrypted[0].holder).toBe('Juan Dela Cruz');
      expect(decrypted[1].provider).toBe('Maya');
    });

    it('fails cleanly with wrong passphrase', async () => {
      const encryptedJson = await createEncryptedBackup(sampleCards, passphrase);
      await expect(
        restoreEncryptedBackup(encryptedJson, 'WrongPassphrase1234!')
      ).rejects.toThrow(/Incorrect passphrase|failed/i);
    });

    it('rejects invalid or corrupted JSON structure', async () => {
      await expect(
        restoreEncryptedBackup('{"not": "valid"}', passphrase)
      ).rejects.toThrow(/Incompatible or invalid backup/i);
    });
  });

  describe('mergeCards duplicate detection', () => {
    it('normalizes provider and number keys', () => {
      expect(normalizeCardKey({ provider: ' GCash ', number: '0917-123-4567' })).toBe('gcash::09171234567');
    });

    it('merges new cards and skips duplicate provider + number', () => {
      const existing = [sampleCards[0]];
      const imported = [
        sampleCards[0], // Duplicate GCash
        sampleCards[1], // New Maya
      ];

      const { merged, addedCount, skippedCount } = mergeCards(existing, imported);
      expect(merged.length).toBe(2);
      expect(addedCount).toBe(1);
      expect(skippedCount).toBe(1);
      expect(merged.map((c) => c.provider)).toEqual(['GCash', 'Maya']);
    });
  });
});
