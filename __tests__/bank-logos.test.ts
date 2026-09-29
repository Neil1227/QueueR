import { describe, it, expect } from 'vitest';
import {
  PH_BANK_BRANDS,
  findBankBrand,
  getBankLogoUrl,
  getBackupLogoUrl,
  getLogoForProvider,
  getBrandColorForProvider,
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

    const customLogo = 'data:image/png;base64,customdata';
    expect(getLogoForProvider('BDO', customLogo)).toBe(customLogo);
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
});
