import type { NextApiRequest, NextApiResponse } from 'next';
import { buildMarketCatalog } from '../../../lib/market/buildMarketCatalog';
import { loadMarketCatalogFromS3, writeMarketCatalogToS3 } from '../../../lib/server/loadMarketCatalog';

function refreshAuthorized(req: NextApiRequest): boolean {
  const secret = process.env.MARKET_CATALOG_REFRESH_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== 'production';
  const auth = req.headers.authorization;
  const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  return bearer === secret || key === secret;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!refreshAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const catalog = await buildMarketCatalog();
    await writeMarketCatalogToS3(catalog);
    return res.status(200).json({
      ok: true,
      generatedAt: catalog.generatedAt,
      cryptoCount: catalog.crypto.length,
      stockCount: catalog.stocks.length,
    });
  } catch (e) {
    console.error('[market/refresh-catalog] failed', e);
    try {
      const previous = await loadMarketCatalogFromS3();
      if (previous.generatedAt > 0) {
        return res.status(502).json({
          error: 'Refresh failed; previous catalog retained',
          previousGeneratedAt: previous.generatedAt,
        });
      }
    } catch {
      // ignore secondary read failure
    }
    return res.status(500).json({ error: 'Refresh failed' });
  }
}
