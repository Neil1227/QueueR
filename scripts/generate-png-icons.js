const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, colorFn) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineSize = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = colorFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc = crc ^ byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Icon generator logic: Apple Blue background, rounded white card with QR pattern
function drawAppIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background gradient: Apple Accent Blue (#007AFF -> #0056B3)
  const bgR = Math.round(0 + (0 - 0) * ny);
  const bgG = Math.round(122 - 36 * ny);
  const bgB = Math.round(255 - 76 * ny);

  // Rounded inner white box
  const pad = 0.18;
  const inBox = nx >= pad && nx <= 1 - pad && ny >= pad && ny <= 1 - pad;

  if (inBox) {
    const rx = (nx - pad) / (1 - 2 * pad);
    const ry = (ny - pad) / (1 - 2 * pad);

    // QR corner squares
    const inTopLeft = rx >= 0.15 && rx <= 0.42 && ry >= 0.15 && ry <= 0.42;
    const inTopRight = rx >= 0.58 && rx <= 0.85 && ry >= 0.15 && ry <= 0.42;
    const inBottomLeft = rx >= 0.15 && rx <= 0.42 && ry >= 0.58 && ry <= 0.85;
    const inBottomRight = rx >= 0.58 && rx <= 0.85 && ry >= 0.58 && ry <= 0.85;

    if (inTopLeft || inTopRight || inBottomLeft || inBottomRight) {
      // Blue QR finder patterns
      return [0, 122, 255, 255];
    }

    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPng(192, 192, drawAppIcon));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPng(512, 512, drawAppIcon));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, drawAppIcon));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(32, 32, drawAppIcon));

console.log('Generated icon-192.png, icon-512.png, apple-touch-icon.png, and favicon.ico.');
