import { describe, it, expect, vi } from 'vitest';
import { onRequestGet } from '../functions/api/bank-logo';

describe('Cloudflare Pages Bank Logo API (/api/bank-logo)', () => {
  it('returns JSON metadata for a known Philippine bank (GCash)', async () => {
    const request = new Request('https://queuer.pages.dev/api/bank-logo?bank=GCash&format=json');
    const response = await onRequestGet({ request, env: {} });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');

    const data = await response.json();
    expect(data.name).toBe('GCash');
    expect(data.domain).toBe('gcash.com');
    expect(data.color).toBe('#007DFE');
    expect(data.logoUrl).toContain('google.com/s2/favicons');
    expect(data.initials).toBe('GC');
  });

  it('returns JSON metadata when queried with aliases like bdo or paymaya', async () => {
    const bdoReq = new Request('https://queuer.pages.dev/api/bank-logo?bank=bdo&format=json');
    const bdoRes = await onRequestGet({ request: bdoReq, env: {} });
    const bdoData = await bdoRes.json();
    expect(bdoData.domain).toBe('bdo.com.ph');

    const mayaReq = new Request('https://queuer.pages.dev/api/bank-logo?bank=paymaya&format=json');
    const mayaRes = await onRequestGet({ request: mayaReq, env: {} });
    const mayaData = await mayaRes.json();
    expect(mayaData.domain).toBe('maya.ph');
  });

  it('supports redirect format for direct image access', async () => {
    const request = new Request('https://queuer.pages.dev/api/bank-logo?bank=BPI&format=redirect');
    const response = await onRequestGet({ request, env: {} });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('google.com/s2/favicons?domain=bpi.com.ph');
  });

  it('returns list of supported banks when ?list is passed', async () => {
    const request = new Request('https://queuer.pages.dev/api/bank-logo?list=true');
    const response = await onRequestGet({ request, env: {} });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.total).toBeGreaterThan(40);
    expect(Array.isArray(data.banks)).toBe(true);
  });

  it('returns 404 for unknown bank query without domain', async () => {
    const request = new Request('https://queuer.pages.dev/api/bank-logo?bank=UnknownNonExistentBankXYZ&format=json');
    const response = await onRequestGet({ request, env: {} });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('Bank not found');
  });
});
