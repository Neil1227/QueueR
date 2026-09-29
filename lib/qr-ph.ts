/**
 * QR Ph & EMVCo Specification Parser and Dynamic Amount Embedder
 * Follows the official EMVCo Merchant-Presented / P2P QR Code Specification & BSP QR Ph Standard.
 */

export interface EMVCoTag {
  id: string;
  length: number;
  value: string;
}

export interface ParsedQRPhInfo {
  isQRPh: boolean;
  pointOfInitiation?: 'static' | 'dynamic';
  currency?: string; // 608 for PHP
  amount?: number;
  payeeName?: string;
  city?: string;
  countryCode?: string;
  note?: string;
}

/**
 * Computes CRC-16 / CCITT-FALSE Checksum (Polynomial 0x1021, Init 0xFFFF)
 * Used for Tag 63 in EMVCo QR codes.
 */
export function computeCRC16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc ^= (byte & 0xff) << 8;

    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Checks whether a payload string follows the EMVCo / QR Ph specification.
 * Starts with Tag 00 ('000201') and has length > 20.
 */
export function isEMVCoPayload(payload?: string | null): boolean {
  if (!payload || typeof payload !== 'string') return false;
  const trimmed = payload.trim();
  return trimmed.startsWith('000201') && trimmed.length >= 20;
}

/**
 * Parses an EMVCo TLV (Tag-Length-Value) string into individual tags.
 */
export function parseEMVCoTags(payload: string): EMVCoTag[] {
  const tags: EMVCoTag[] = [];
  let index = 0;
  const len = payload.length;

  while (index + 4 <= len) {
    const id = payload.slice(index, index + 2);
    const tagLenStr = payload.slice(index + 2, index + 4);
    const tagLen = parseInt(tagLenStr, 10);

    if (isNaN(tagLen) || index + 4 + tagLen > len) {
      break;
    }

    const value = payload.slice(index + 4, index + 4 + tagLen);
    tags.push({ id, length: tagLen, value });
    index += 4 + tagLen;
  }

  return tags;
}

/**
 * Encodes a list of EMVCo tags back into an EMVCo string and recalculates Tag 63 CRC.
 */
export function encodeEMVCoTags(tags: EMVCoTag[]): string {
  // Filter out any existing Tag 63 (CRC)
  const filteredTags = tags.filter((t) => t.id !== '63');

  let output = '';
  for (const tag of filteredTags) {
    const val = tag.value;
    const lenStr = val.length.toString().padStart(2, '0');
    output += `${tag.id}${lenStr}${val}`;
  }

  // Append Tag 63 header ('6304')
  const payloadToSign = `${output}6304`;
  const checksum = computeCRC16(payloadToSign);

  return `${payloadToSign}${checksum}`;
}

/**
 * Parses high-level information from a QR Ph / EMVCo payload.
 */
export function parseQRPh(payload?: string | null): ParsedQRPhInfo {
  if (!payload || !isEMVCoPayload(payload)) {
    return { isQRPh: false };
  }

  const tags = parseEMVCoTags(payload);
  const tagMap = new Map(tags.map((t) => [t.id, t.value]));

  const initMethod = tagMap.get('01');
  const amountStr = tagMap.get('54');
  const currency = tagMap.get('53');
  const countryCode = tagMap.get('58');
  const payeeName = tagMap.get('59');
  const city = tagMap.get('60');

  // Extract reference note from Tag 62 if present
  let note: string | undefined;
  const tag62 = tagMap.get('62');
  if (tag62) {
    const subTags = parseEMVCoTags(tag62);
    const subMap = new Map(subTags.map((t) => [t.id, t.value]));
    note = subMap.get('05') || subMap.get('08') || subMap.get('01');
  }

  return {
    isQRPh: true,
    pointOfInitiation: initMethod === '12' ? 'dynamic' : 'static',
    currency: currency === '608' ? 'PHP' : currency,
    amount: amountStr ? parseFloat(amountStr) : undefined,
    payeeName,
    city,
    countryCode,
    note,
  };
}

/**
 * Dynamically injects or updates the transaction amount and reference note in a QR Ph / EMVCo payload.
 *
 * @param payload Original QR code payload string
 * @param amount Exact Peso amount to embed (e.g. 350.00)
 * @param note Optional reference / invoice note (e.g. "Lunch")
 * @returns Updated EMVCo string with valid Tag 54, Tag 62, and Tag 63 CRC
 */
export function embedAmountInQRPh(
  payload: string,
  amount: number,
  note?: string
): string {
  if (!payload || !isEMVCoPayload(payload)) {
    return payload;
  }

  const tags = parseEMVCoTags(payload);
  const tagMap = new Map(tags.map((t) => [t.id, t.value]));

  // 1. Tag 01: Set Point of Initiation Method to '12' (Dynamic QR with embedded amount)
  tagMap.set('01', '12');

  // 2. Tag 53: Ensure Transaction Currency is PHP (608) if not present
  if (!tagMap.has('53')) {
    tagMap.set('53', '608');
  }

  // 3. Tag 54: Transaction Amount formatted to 2 decimal places (e.g. "350.00")
  const formattedAmount = amount.toFixed(2);
  tagMap.set('54', formattedAmount);

  // 4. Tag 62: Additional Data (Reference Note) if provided
  if (note && note.trim()) {
    const cleanNote = note.trim().slice(0, 25); // Max 25 chars for mobile banking safety
    const subtag05 = `05${cleanNote.length.toString().padStart(2, '0')}${cleanNote}`;
    tagMap.set('62', subtag05);
  }

  // Re-assemble tag array in standard EMVCo sequence order
  const updatedTags: EMVCoTag[] = [];
  const standardOrder = [
    '00', '01', '02', '03', '04', '05', '26', '27', '28', '29', '30',
    '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62',
  ];

  // Add tags in standard order
  for (const id of standardOrder) {
    if (tagMap.has(id)) {
      const val = tagMap.get(id)!;
      updatedTags.push({ id, length: val.length, value: val });
      tagMap.delete(id);
    }
  }

  // Add any remaining custom tags
  for (const [id, val] of tagMap.entries()) {
    if (id !== '63') {
      updatedTags.push({ id, length: val.length, value: val });
    }
  }

  return encodeEMVCoTags(updatedTags);
}

/**
 * Removes dynamic amount from QR Ph payload to restore static QR.
 */
export function removeAmountFromQRPh(payload: string): string {
  if (!payload || !isEMVCoPayload(payload)) {
    return payload;
  }

  const tags = parseEMVCoTags(payload);
  const updatedTags = tags.filter((t) => t.id !== '54' && t.id !== '62');

  // Reset initiation method to static (11)
  const tag01 = updatedTags.find((t) => t.id === '01');
  if (tag01) {
    tag01.value = '11';
    tag01.length = 2;
  }

  return encodeEMVCoTags(updatedTags);
}
