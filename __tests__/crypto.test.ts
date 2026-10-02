import { describe, it, expect } from 'vitest';
import { deriveKey, encryptText, decryptText, generateSalt } from '../lib/crypto';

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

  it('automatically encrypts cardholder names and account numbers for storage and decrypts them for display', async () => {
    const { deriveUserKey, encryptCardForStorage, decryptCardFromStorage } = await import('../lib/crypto');
    const salt = generateSalt();
    const key = await deriveUserKey('user-12345', salt);

    const rawCard = {
      id: 'card-abc',
      provider: 'GCash',
      color: '#007DFE',
      holder: 'Juan Dela Cruz',
      number: '0917 123 4567',
      label: 'Personal',
      category: 'personal' as const,
      payload: '000201010211...',
      isDefault: true,
      useCount: 0,
      lastUsedAt: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      v: 1 as const,
    };

    const cloudCard = await encryptCardForStorage(rawCard, key);

    // In Cloud/Firestore: plaintext name and number MUST be empty!
    expect(cloudCard.holder).toBe('');
    expect(cloudCard.number).toBe('');
    expect(cloudCard.payload).toBeNull();
    // Ciphertext must be present
    expect(cloudCard.holderEnc?.startsWith('enc:v1:')).toBe(true);
    expect(cloudCard.numberEnc?.startsWith('enc:v1:')).toBe(true);
    expect(cloudCard.payloadEnc?.startsWith('enc:v1:')).toBe(true);

    // Decrypting on client
    const decryptedCard = await decryptCardFromStorage(cloudCard, key);
    expect(decryptedCard.holder).toBe('Juan Dela Cruz');
    expect(decryptedCard.number).toBe('0917 123 4567');
    expect(decryptedCard.payload).toBe('000201010211...');
  });
});
