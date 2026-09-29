const fs = require('fs');
const path = require('path');
const { createCanvas } = (() => {
  try {
    return require('canvas');
  } catch {
    return { createCanvas: null };
  }
})();

// Create a basic valid 1x1 PNG or generate proper PNG buffers using pure JS if canvas is not installed
function createSvgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size}" fill="none">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#007AFF"/>
  <rect x="${Math.round(size * 0.18)}" y="${Math.round(size * 0.18)}" width="${Math.round(size * 0.64)}" height="${Math.round(size * 0.64)}" rx="${Math.round(size * 0.14)}" fill="#FFFFFF"/>
  <rect x="${Math.round(size * 0.28)}" y="${Math.round(size * 0.28)}" width="${Math.round(size * 0.2)}" height="${Math.round(size * 0.2)}" rx="${Math.round(size * 0.04)}" fill="#007AFF"/>
  <rect x="${Math.round(size * 0.52)}" y="${Math.round(size * 0.28)}" width="${Math.round(size * 0.2)}" height="${Math.round(size * 0.2)}" rx="${Math.round(size * 0.04)}" fill="#007AFF"/>
  <rect x="${Math.round(size * 0.28)}" y="${Math.round(size * 0.52)}" width="${Math.round(size * 0.2)}" height="${Math.round(size * 0.2)}" rx="${Math.round(size * 0.04)}" fill="#007AFF"/>
  <rect x="${Math.round(size * 0.56)}" y="${Math.round(size * 0.56)}" width="${Math.round(size * 0.12)}" height="${Math.round(size * 0.12)}" rx="${Math.round(size * 0.02)}" fill="#007AFF"/>
</svg>`;
}

// Generate simple PNG icons
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG icons and standard placeholder icons
fs.writeFileSync(path.join(publicDir, 'icon.svg'), createSvgIcon(512));
console.log('SVG icon generated.');
