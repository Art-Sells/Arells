import type { NextApiRequest, NextApiResponse } from 'next';
import { buildFallbackMarketCatalog } from '../../../lib/market/buildFallbackMarketCatalog';
import { ensureMarketCatalog } from '../../../lib/server/ensureMarketCatalog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const catalog = await ensureMarketCatalog();
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(catalog);
  } catch (e) {
    console.error('[market/catalog] load failed', e);
    return res.status(200).json(buildFallbackMarketCatalog());
  }
}
