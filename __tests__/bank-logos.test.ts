import { describe, it, expect } from 'vitest';
import {
  PH_BANK_BRANDS,
  findBankBrand,
  getBankLogoUrl,
  getBackupLogoUrl,
  getLogoForProvider,
  getBrandColorForProvider,
  getProviderInitials,
  searchBanks,
} from '../lib/bank-logos';

describe('Philippine Banks Catalog & Logo API', () => {
  it('contains comprehensive list of Philippine financial institutions', () => {
    expect(PH_BANK_BRANDS.length).toBeGreaterThan(40);
  });

  it('includes major digital banks including MariBank and SeaBank', () => {
    const maribank = findBankBrand('MariBank');
    expect(maribank).toBeDefined();
    expect(maribank?.name).toBe('MariBank');
    expect(maribank?.category).toBe('digital-bank');
    expect(maribank?.domain).toBe('maribank.ph');

    const seabank = findBankBrand('SeaBank');
    expect(seabank).toBeDefined();
    expect(seabank?.name).toBe('SeaBank');

    const gotyme = findBankBrand('GoTyme');
    expect(gotyme).toBeDefined();

    const tonik = findBankBrand('Tonik');
    expect(tonik).toBeDefined();

    const mayabank = findBankBrand('Maya Bank');
    expect(mayabank).toBeDefined();
  });

  it('correctly matches banks by aliases and colloquial names', () => {
    expect(findBankBrand('gcash')?.name).toBe('GCash');
    expect(findBankBrand('paymaya')?.name).toBe('Maya');
    expect(findBankBrand('banco de oro')?.name).toBe('BDO Unibank');
    expect(findBankBrand('bank of the philippine islands')?.name).toBe('BPI');
    expect(findBankBrand('ubp')?.name).toBe('UnionBank');
    expect(findBankBrand('lbp')?.name).toBe('Landbank');
    expect(findBankBrand('pulz')?.name).toBe('RCBC');
    expect(findBankBrand('diskartech')?.name).toBe('RCBC');
    expect(findBankBrand('komo')?.name).toBe('EastWest Bank');
  });

  it('generates high-res Google Favicon API and backup Unavatar URLs', () => {
    const url = getBankLogoUrl('gcash.com', 128);
    expect(url).toBe('https://www.google.com/s2/favicons?domain=gcash.com&sz=128');

    const backupUrl = getBackupLogoUrl('gcash.com');
    expect(backupUrl).toBe('https://unavatar.io/gcash.com?fallback=false');
  });

  it('resolves logo URL for provider names', () => {
    const logoUrl = getLogoForProvider('BDO');
    expect(logoUrl).toContain('bdo.com.ph');
  });

  it('resolves brand colors accurately', () => {
    expect(getBrandColorForProvider('GCash')).toBe('#007DFE');
    expect(getBrandColorForProvider('Maya')).toBe('#1FBF6B');
    expect(getBrandColorForProvider('Unknown Provider', '#123456')).toBe('#123456');
  });

  it('searches and filters banks by query and category', () => {
    const digitalBanks = searchBanks('', 'digital-bank');
    expect(digitalBanks.length).toBeGreaterThan(5);
    expect(digitalBanks.every((b) => b.category === 'digital-bank')).toBe(true);

    const searchResults = searchBanks('bpi');
    expect(searchResults.some((b) => b.name.includes('BPI'))).toBe(true);
  });

  describe('getProviderInitials (Smart Monogram Generation)', () => {
    it('generates PM for PayMaya (PascalCase/CamelCase single word)', () => {
      expect(getProviderInitials('PayMaya')).toBe('PM');
    });

    it('generates GC for GCash and SB for SeaBank', () => {
      expect(getProviderInitials('GCash')).toBe('GC');
      expect(getProviderInitials('SeaBank')).toBe('SB');
      expect(getProviderInitials('GrabPay')).toBe('GP');
      expect(getProviderInitials('ShopeePay')).toBe('SP');
      expect(getProviderInitials('PalawanPay')).toBe('PP');
      expect(getProviderInitials('JuanCash')).toBe('JC');
      expect(getProviderInitials('BillEase')).toBe('BE');
      expect(getProviderInitials('StarPay')).toBe('SP');
      expect(getProviderInitials('PayMongo')).toBe('PM');
    });

    it('preserves short acronyms in uppercase up to 4 chars', () => {
      expect(getProviderInitials('BPI')).toBe('BPI');
      expect(getProviderInitials('BDO')).toBe('BDO');
      expect(getProviderInitials('RCBC')).toBe('RCBC');
      expect(getProviderInitials('PNB')).toBe('PNB');
      expect(getProviderInitials('DBP')).toBe('DBP');
      expect(getProviderInitials('UBP')).toBe('UBP');
    });

    it('generates initials for multi-word names while skipping stop words', () => {
      expect(getProviderInitials('Bank of Commerce')).toBe('BC');
      expect(getProviderInitials('Bank of the Philippine Islands')).toBe('BP');
      expect(getProviderInitials('Union Bank')).toBe('UB');
      expect(getProviderInitials('Palawan Express')).toBe('PE');
      expect(getProviderInitials('GoTyme Bank')).toBe('GB');
      expect(getProviderInitials('Sea Bank')).toBe('SB');
      expect(getProviderInitials('My Store')).toBe('MS');
    });

    it('generates initials for single regular words and handles dots/hyphens', () => {
      expect(getProviderInitials('Maya')).toBe('MA');
      expect(getProviderInitials('Store')).toBe('ST');
      expect(getProviderInitials('Coins.ph')).toBe('CP');
      expect(getProviderInitials('7-Eleven')).toBe('7E');
    });

    it('returns QR fallback for empty or whitespace inputs', () => {
      expect(getProviderInitials('')).toBe('QR');
      expect(getProviderInitials('   ')).toBe('QR');
      expect(getProviderInitials(null)).toBe('QR');
      expect(getProviderInitials(undefined)).toBe('QR');
    });
  });
});

