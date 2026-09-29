import { describe, it, expect } from 'vitest';
import { fgFor, shadeColor, getCardGradient } from '../lib/colors';

describe('Color utilities', () => {
  describe('fgFor', () => {
    it('returns #1D1D1F for high luminance (light) backgrounds', () => {
      expect(fgFor('#FFFFFF')).toBe('#1D1D1F');
      expect(fgFor('#F5F5F7')).toBe('#1D1D1F');
      expect(fgFor('#FFFF00')).toBe('#1D1D1F');
      expect(fgFor('#E5E5EA')).toBe('#1D1D1F');
    });

    it('returns #FFFFFF for low luminance (dark) backgrounds', () => {
      expect(fgFor('#000000')).toBe('#FFFFFF');
      expect(fgFor('#1D1D1F')).toBe('#FFFFFF');
      expect(fgFor('#007DFE')).toBe('#FFFFFF'); // GCash blue
      expect(fgFor('#1FBF6B')).toBe('#FFFFFF'); // Maya green (lum ~133.6 <= 170)
      expect(fgFor('#B3151B')).toBe('#FFFFFF'); // BPI red
      expect(fgFor('#0A3D91')).toBe('#FFFFFF'); // BDO navy
    });
  });

  describe('shadeColor', () => {
    it('darkens color when given negative amount', () => {
      const darkened = shadeColor('#FFFFFF', -50);
      expect(darkened.toLowerCase()).toBe('#cdcdcd');
    });

    it('clamps values between 0 and 255', () => {
      expect(shadeColor('#000000', -50)).toBe('#000000');
      expect(shadeColor('#FFFFFF', 50)).toBe('#ffffff');
    });
  });

  describe('getCardGradient', () => {
    it('creates a 135deg linear gradient with shaded secondary color', () => {
      const grad = getCardGradient('#007DFE');
      expect(grad).toContain('linear-gradient(135deg, #007DFE,');
    });
  });
});
