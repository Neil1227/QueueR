import { describe, it, expect } from 'vitest';
import {
  deriveKey,
  encryptText,
  decryptText,
  generateSalt,
  getUserStorageKey,
  encryptCardForStorage,
  decryptCardFromStorage,
} from '../lib/crypto';

describe('E2EE WebCrypto utilities', () => {
  it('generates a 16-byte base64 salt', () => {
    const salt = generateSalt();
    expect(typeof salt).toBe('string');
    expect(salt.length).toBeGreaterThanOrEqual(16);
  });

  it('performs full encryption and decryption round-trip', async () => {
    const passphrase = 'SuperSecretPassphrase!123';
    const salt = generateSalt();
    const key = await deriveKey(passphrase, salt);

    const sensitiveNumber = '0917 123 4567';
    const encrypted = await encryptText(sensitiveNumber, key);

    expect(encrypted.startsWith('enc:v1:')).toBe(true);
    expect(encrypted).not.toContain(sensitiveNumber);

    const decrypted = await decryptText(encrypted, key);
    expect(decrypted).toBe(sensitiveNumber);
  });

  it('fails decryption with wrong key/passphrase', async () => {
    const salt = generateSalt();
    const key1 = await deriveKey('correct-pass', salt);
    const key2 = await deriveKey('wrong-pass', salt);

    const encrypted = await encryptText('Secret QR Payload', key1);

    await expect(decryptText(encrypted, key2)).rejects.toThrow();
  });

  it('derives user storage encryption key and encrypts/decrypts card for Firestore storage', async () => {
    const userId = 'firebase-user-123456';
    const key = await getUserStorageKey(userId);
    expect(key).toBeDefined();

    const plainCard = {
      id: 'test-card-1',
      provider: 'GCash',
      color: '#007DFE',
      holder: 'Juan Dela Cruz',
      number: '0917 123 4567',
      label: 'Personal Pocket',
      category: 'personal' as const,
      payload: '00020101021127830012com.p2pqrpay0111GXCHPHM2XXX',
      isDefault: true,
      useCount: 0,
      lastUsedAt: 0,
      createdAt: 1790730078474,
      updatedAt: 1790730078474,
      v: 1 as const,
    };

    // Encrypt card before storing in Firestore
    const storedCard = await encryptCardForStorage(plainCard, key);

    // Database fields MUST be ciphertexts, not plain text
    expect(storedCard.holder.startsWith('enc:v1:')).toBe(true);
    expect(storedCard.holder).not.toContain('Juan Dela Cruz');

    expect(storedCard.number.startsWith('enc:v1:')).toBe(true);
    expect(storedCard.number).not.toContain('0917 123 4567');

    expect(storedCard.payload.startsWith('enc:v1:')).toBe(true);
    expect(storedCard.payload).not.toContain('00020101021127830012com.p2pqrpay0111GXCHPHM2XXX');

    // Decrypt card when read from Firestore
    const restoredCard = await decryptCardFromStorage(storedCard, key);
    expect(restoredCard.holder).toBe('Juan Dela Cruz');
    expect(restoredCard.number).toBe('0917 123 4567');
    expect(restoredCard.payload).toBe('00020101021127830012com.p2pqrpay0111GXCHPHM2XXX');
  });

  it('safely handles legacy unencrypted cards when decrypting from storage', async () => {
    const userId = 'firebase-user-legacy';
    const key = await getUserStorageKey(userId);

    const legacyCard = {
      id: 'legacy-card-1',
      provider: 'Maya',
      holder: 'Maria Santos',
      number: '0918 000 0000',
      payload: '00020101021126510014ph.ppmi.p2pqr',
    };

    const result = await decryptCardFromStorage(legacyCard, key);
    expect(result.holder).toBe('Maria Santos');
    expect(result.number).toBe('0918 000 0000');
    expect(result.payload).toBe('00020101021126510014ph.ppmi.p2pqr');
  });
});
