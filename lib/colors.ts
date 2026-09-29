/**
 * Utilities for brand color shading, luminance, and auto-contrast calculation.
 */

/**
 * Adjust hex color brightness by amount (-255 to 255).
 */
export function shadeColor(hex: string, amt: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const pairs = cleanHex.match(/../g);
  if (!pairs || pairs.length < 3) return hex;

  const [r, g, b] = pairs.map((h) => {
    const val = parseInt(h, 16) + amt;
    return Math.max(0, Math.min(255, val)).toString(16).padStart(2, '0');
  });

  return `#${r}${g}${b}`;
}

/**
 * Determine foreground text color (#1D1D1F or #FFFFFF) based on relative luminance.
 * Luminance formula matching the reference PWA: (r * .299 + g * .587 + b * .114) > 170
 */
export function fgFor(hex: string): '#1D1D1F' | '#FFFFFF' {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const pairs = cleanHex.match(/../g);
  if (!pairs || pairs.length < 3) return '#FFFFFF';

  const [r, g, b] = pairs.map((h) => parseInt(h, 16));
  const lum = r * 0.299 + g * 0.587 + b * 0.114;
  return lum > 170 ? '#1D1D1F' : '#FFFFFF';
}

/**
 * Generate CSS gradient for card background.
 */
export function getCardGradient(hex: string): string {
  const c2 = shadeColor(hex, -38);
  return `linear-gradient(135deg, ${hex}, ${c2})`;
}

/**
 * Returns the two color stops for the card gradient.
 */
export function getCardGradientColors(hex: string): { c1: string; c2: string } {
  return {
    c1: hex,
    c2: shadeColor(hex, -38),
  };
}
