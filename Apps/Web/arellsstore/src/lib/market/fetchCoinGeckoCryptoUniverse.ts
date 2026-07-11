import axios from 'axios';
import { MARKET_CATALOG_CRYPTO_LIMIT } from './marketCatalogTypes';

const COINGECKO_PRO = 'https://pro-api.coingecko.com/api/v3';

export type CoinGeckoMarketRow = {
  id: string;
  symbol: string;
  name: string;
  marketCapUsd: number;
};

const STABLE_SYMBOLS = new Set([
  'USDT',
  'USDC',
  'DAI',
  'BUSD',
  'TUSD',
  'USDP',
  'USDD',
  'FRAX',
  'LUSD',
  'GUSD',
  'USDE',
  'FDUSD',
  'PYUSD',
  'EURC',
  'EURT',
]);

function coingeckoHeaders(): Record<string, string> | undefined {
  const key = process.env.COINGECKO_API_KEY?.trim();
  return key ? { 'x-cg-pro-api-key': key } : undefined;
}

type CoinGeckoMarketApiRow = {
  id?: string;
  symbol?: string;
  name?: string;
  market_cap?: number;
};

async function fetchStablecoinIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let page = 1;
  while (page <= 10) {
    try {
      const { data } = await axios.get<{ id?: string }[]>(`${COINGECKO_PRO}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          category: 'stablecoins',
          order: 'market_cap_desc',
          per_page: 250,
          page,
          sparkline: false,
        },
        headers: coingeckoHeaders(),
        timeout: 30_000,
      });
      if (!Array.isArray(data) || data.length === 0) break;
      for (const coin of data) {
        if (coin.id) ids.add(coin.id);
      }
      if (data.length < 250) break;
      page += 1;
    } catch {
      break;
    }
  }
  return ids;
}

function isLikelyStable(coin: CoinGeckoMarketApiRow, stableIds: Set<string>): boolean {
  const id = coin.id ?? '';
  const symbol = (coin.symbol ?? '').toUpperCase();
  const name = (coin.name ?? '').toLowerCase();
  if (stableIds.has(id)) return true;
  if (STABLE_SYMBOLS.has(symbol)) return true;
  if (name.includes('stablecoin') || name.includes('wrapped ') && name.includes('usd')) return true;
  if (/^usd/i.test(symbol) && (name.includes('dollar') || name.includes('usd'))) return true;
  return false;
}

export async function fetchCoinGeckoCryptoUniverse(
  limit = MARKET_CATALOG_CRYPTO_LIMIT
): Promise<CoinGeckoMarketRow[]> {
  const stableIds = await fetchStablecoinIds();
  const results: CoinGeckoMarketRow[] = [];
  let page = 1;
  const perPage = 250;

  while (results.length < limit && page <= 20) {
    const { data } = await axios.get<CoinGeckoMarketApiRow[]>(`${COINGECKO_PRO}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: perPage,
        page,
        sparkline: false,
      },
      headers: coingeckoHeaders(),
      timeout: 30_000,
    });

    if (!Array.isArray(data) || data.length === 0) break;

    for (const coin of data) {
      if (!coin.id || !coin.symbol || !coin.name) continue;
      if (isLikelyStable(coin, stableIds)) continue;
      const marketCapUsd = typeof coin.market_cap === 'number' ? coin.market_cap : 0;
      if (marketCapUsd <= 0) continue;

      results.push({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        marketCapUsd,
      });
      if (results.length >= limit) break;
    }

    if (data.length < perPage) break;
    page += 1;
  }

  return results;
}
