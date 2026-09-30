/**
 * WebCrypto-based End-to-End Encryption (E2EE) utilities.
 * Uses PBKDF2 (100,000 iterations, SHA-256) for key derivation
 * and AES-GCM (256-bit key, 12-byte IV) for encryption/decryption.
 */

// Helper to convert Uint8Array <-> Base64
export function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a cryptographically secure random salt string (Base64).
 */
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return bufferToBase64(array);
}

/**
 * Derive an AES-GCM 256-bit CryptoKey from a passphrase and salt using PBKDF2.
 */
export async function deriveKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBuffer = base64ToBuffer(saltB64);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string using AES-GCM.
 * Output format: "enc:v1:<iv_b64>:<ciphertext_b64>"
 */
export async function encryptText(plaintext: string, key: CryptoKey): Promise<string> {
  if (!plaintext) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    encoded
  );

  return `enc:v1:${bufferToBase64(iv)}:${bufferToBase64(ciphertext)}`;
}

/**
 * Decrypt a formatted ciphertext string using AES-GCM.
 */
export async function decryptText(encryptedString: string, key: CryptoKey): Promise<string> {
  if (!encryptedString) return '';
  if (!encryptedString.startsWith('enc:v1:')) {
    // Plaintext fallback if not encrypted
    return encryptedString;
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = base64ToBuffer(parts[2]);
  const ciphertext = base64ToBuffer(parts[3]);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

const userKeyCache = new Map<string, CryptoKey>();

/**
 * Derives or retrieves a cached 256-bit AES-GCM user storage key for client-side Firestore encryption.
 * Derived with PBKDF2 (100,000 iterations) from the user's UID and a static domain pepper.
 */
export async function getUserStorageKey(userId: string): Promise<CryptoKey> {
  if (userKeyCache.has(userId)) {
    return userKeyCache.get(userId)!;
  }

  const pepper = 'QueueR_AES256_Database_Pepper_2026_PH_Salt';
  const enc = new TextEncoder();
  const saltB64 = bufferToBase64(enc.encode(pepper));

  const key = await deriveKey(userId, saltB64);
  userKeyCache.set(userId, key);
  return key;
}

/**
 * Encrypts sensitive fields (holder, number, payload, imgB64) of a card using AES-GCM 256-bit.
 * In the Firestore database, these fields are stored exclusively as "enc:v1:<iv>:<ciphertext>".
 */
export async function encryptCardForStorage<T extends Record<string, any>>(card: T, key: CryptoKey): Promise<T> {
  const encHolder =
    typeof card.holder === 'string' && card.holder.length > 0 && !card.holder.startsWith('enc:v1:')
      ? await encryptText(card.holder, key)
      : card.holder;

  const encNumber =
    typeof card.number === 'string' && card.number.length > 0 && !card.number.startsWith('enc:v1:')
      ? await encryptText(card.number, key)
      : card.number;

  const encPayload =
    typeof card.payload === 'string' && card.payload.length > 0 && !card.payload.startsWith('enc:v1:')
      ? await encryptText(card.payload, key)
      : card.payload;

  const encImgB64 =
    typeof card.imgB64 === 'string' && card.imgB64.length > 0 && !card.imgB64.startsWith('enc:v1:')
      ? await encryptText(card.imgB64, key)
      : card.imgB64;

  return {
    ...card,
    holder: encHolder,
    number: encNumber,
    payload: encPayload,
    imgB64: encImgB64,
  };
}

/**
 * Decrypts encrypted fields (holder, number, payload, imgB64) of a card retrieved from Firestore.
 */
export async function decryptCardFromStorage<T extends Record<string, any>>(card: T, key: CryptoKey): Promise<T> {
  const decHolder =
    typeof card.holder === 'string' && card.holder.startsWith('enc:v1:')
      ? await decryptText(card.holder, key)
      : card.holder;

  const decNumber =
    typeof card.number === 'string' && card.number.startsWith('enc:v1:')
      ? await decryptText(card.number, key)
      : card.number;

  const decPayload =
    typeof card.payload === 'string' && card.payload.startsWith('enc:v1:')
      ? await decryptText(card.payload, key)
      : card.payload;

  const decImgB64 =
    typeof card.imgB64 === 'string' && card.imgB64.startsWith('enc:v1:')
      ? await decryptText(card.imgB64, key)
      : card.imgB64;

  return {
    ...card,
    holder: decHolder,
    number: decNumber,
    payload: decPayload,
    imgB64: decImgB64,
  };
}
