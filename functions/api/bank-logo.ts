import {
  findBankBrand,
  getBankLogoUrl,
  getBackupLogoUrl,
  getProviderInitials,
  PH_BANK_BRANDS,
} from '../../lib/bank-logos';

interface Env {
  // Bindings can be declared here if needed
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(context.request.url);
  const bankQuery =
    url.searchParams.get('bank') ||
    url.searchParams.get('name') ||
    url.searchParams.get('q') ||
    '';
  const domainQuery = url.searchParams.get('domain') || '';
  const size = parseInt(url.searchParams.get('size') || '128', 10);
  const format = (url.searchParams.get('format') || 'image').toLowerCase();

  // List all supported banks catalog
  if (url.searchParams.has('list') || bankQuery === 'list') {
    return new Response(
      JSON.stringify({
        total: PH_BANK_BRANDS.length,
        banks: PH_BANK_BRANDS,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        },
      }
    );
  }

  let targetDomain = domainQuery;
  let brand = null;

  if (bankQuery) {
    brand = findBankBrand(bankQuery);
    if (brand?.domain) {
      targetDomain = brand.domain;
    }
  }

  if (!targetDomain && !brand) {
    return new Response(
      JSON.stringify({
        error: 'Bank not found or missing "bank" query parameter. Example: /api/bank-logo?bank=GCash',
        supportedExamples: ['GCash', 'Maya', 'BPI', 'BDO', 'UnionBank', 'SeaBank', 'Gotyme', 'Landbank'],
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const primaryLogoUrl = targetDomain ? getBankLogoUrl(targetDomain, size) : '';
  const backupLogoUrl = targetDomain ? getBackupLogoUrl(targetDomain) : '';
  const initials = getProviderInitials(bankQuery || brand?.name || targetDomain);
  const color = brand?.color || '#007AFF';

  // Return JSON metadata if requested
  if (format === 'json') {
    return new Response(
      JSON.stringify({
        name: brand?.name || bankQuery,
        shortName: brand?.shortName,
        domain: targetDomain,
        logoUrl: primaryLogoUrl,
        backupLogoUrl: backupLogoUrl,
        color: color,
        category: brand?.category || 'bank',
        initials: initials,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      }
    );
  }

  if (format === 'redirect') {
    return Response.redirect(primaryLogoUrl, 302);
  }

  // By default: Fetch and stream high-res logo image directly
  try {
    const upstream = await fetch(primaryLogoUrl);
    if (upstream.ok) {
      const contentType = upstream.headers.get('Content-Type') || 'image/png';
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      });
    }

    if (backupLogoUrl) {
      const backupRes = await fetch(backupLogoUrl);
      if (backupRes.ok) {
        const contentType = backupRes.headers.get('Content-Type') || 'image/png';
        return new Response(backupRes.body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400, s-maxage=604800',
          },
        });
      }
    }
  } catch {
    // If upstream fetch times out or fails, gracefully redirect
    return Response.redirect(primaryLogoUrl, 302);
  }

  return Response.redirect(primaryLogoUrl, 302);
}
