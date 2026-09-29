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
});
