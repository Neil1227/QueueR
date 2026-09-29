import { describe, it, expect } from 'vitest';
import {
  computeCRC16,
  isEMVCoPayload,
  parseEMVCoTags,
  encodeEMVCoTags,
  parseQRPh,
  embedAmountInQRPh,
  removeAmountFromQRPh,
} from '@/lib/qr-ph';

describe('QR Ph & EMVCo Specification Suite', () => {
  // Real standard GCash / QR Ph payload example
  const SAMPLE_QR_PH =
    '00020101021126510014ph.ppmi.p2pqr0111GCASHXXXXXX02159999999999999995204601653036085802PH5911JUAN D CRUZ6006MANILA6304A1B2';

  it('correctly calculates CRC16 CCITT-FALSE', () => {
    // Standard test vector: "123456789" -> 0x29B1 in CRC16 CCITT-FALSE
    const crc = computeCRC16('123456789');
    expect(crc).toBe('29B1');
  });

  it('detects valid EMVCo payloads', () => {
    expect(isEMVCoPayload(SAMPLE_QR_PH)).toBe(true);
    expect(isEMVCoPayload('https://example.com/pay')).toBe(false);
    expect(isEMVCoPayload('')).toBe(false);
    expect(isEMVCoPayload(null)).toBe(false);
  });

  it('parses EMVCo tags correctly', () => {
    const tags = parseEMVCoTags(SAMPLE_QR_PH);
    const tagMap = new Map(tags.map((t) => [t.id, t.value]));

    expect(tagMap.get('00')).toBe('01');
    expect(tagMap.get('01')).toBe('11'); // Static QR
    expect(tagMap.get('53')).toBe('608'); // PHP
    expect(tagMap.get('58')).toBe('PH');
    expect(tagMap.get('59')).toBe('JUAN D CRUZ');
    expect(tagMap.get('60')).toBe('MANILA');
  });

  it('parses high-level QR Ph info', () => {
    const info = parseQRPh(SAMPLE_QR_PH);
    expect(info.isQRPh).toBe(true);
    expect(info.pointOfInitiation).toBe('static');
    expect(info.currency).toBe('PHP');
    expect(info.payeeName).toBe('JUAN D CRUZ');
    expect(info.city).toBe('MANILA');
    expect(info.countryCode).toBe('PH');
    expect(info.amount).toBeUndefined();
  });

  it('embeds dynamic amount and note into QR Ph payload', () => {
    const embedded = embedAmountInQRPh(SAMPLE_QR_PH, 350.5, 'Lunch with team');

    expect(isEMVCoPayload(embedded)).toBe(true);

    const parsed = parseQRPh(embedded);
    expect(parsed.pointOfInitiation).toBe('dynamic');
    expect(parsed.amount).toBe(350.5);
    expect(parsed.note).toBe('Lunch with team');

    // Check raw tags
    const tags = parseEMVCoTags(embedded);
    const tagMap = new Map(tags.map((t) => [t.id, t.value]));
    expect(tagMap.get('01')).toBe('12'); // Dynamic Point of Initiation
    expect(tagMap.get('54')).toBe('350.50'); // Amount formatted with 2 decimals
    expect(tagMap.has('62')).toBe(true); // Additional Data Field
    expect(tagMap.get('59')).toBe('JUAN D CRUZ'); // Payee preserved

    // Validate Tag 63 CRC
    const withoutCRC = embedded.slice(0, -4);
    const expectedCRC = computeCRC16(withoutCRC);
    const actualCRC = embedded.slice(-4);
    expect(actualCRC).toBe(expectedCRC);
  });

  it('removes dynamic amount to restore static QR', () => {
    const embedded = embedAmountInQRPh(SAMPLE_QR_PH, 500, 'Dinner');
    const restored = removeAmountFromQRPh(embedded);

    const parsed = parseQRPh(restored);
    expect(parsed.pointOfInitiation).toBe('static');
    expect(parsed.amount).toBeUndefined();
    expect(parsed.note).toBeUndefined();

    const tags = parseEMVCoTags(restored);
    const tagMap = new Map(tags.map((t) => [t.id, t.value]));
    expect(tagMap.get('01')).toBe('11');
    expect(tagMap.has('54')).toBe(false);
  });

  it('safely handles non-EMVCo payloads', () => {
    const rawUrl = 'https://gcash.com/qr/sample';
    expect(embedAmountInQRPh(rawUrl, 100)).toBe(rawUrl);
    expect(removeAmountFromQRPh(rawUrl)).toBe(rawUrl);
    expect(parseQRPh(rawUrl)).toEqual({ isQRPh: false });
  });
});
