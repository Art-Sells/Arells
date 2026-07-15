import axios from 'axios';

const MASSIVE_BASE = 'https://api.massive.com';

function massiveApiKey(): string {
  const key = process.env.MASSIVE_API_KEY?.trim();
  if (!key) throw new Error('MASSIVE_API_KEY is not set');
  return key;
}

type PrevBar = {
  c?: number;
  o?: number;
  h?: number;
  l?: number;
  v?: number;
  vw?: number;
  t?: number;
};

type DailyBar = {
  c?: number;
  t?: number;
  v?: number;
  vw?: number;
};

/** Latest tradeable close (previous session bar). */
export async function fetchMassivePrevClose(ticker: string): Promise<{
  price: number;
  asOfMs: number | null;
}> {
  const apiKey = massiveApiKey();
  const { data } = await axios.get(`${MASSIVE_BASE}/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev`, {
    params: { adjusted: true, apiKey },
    timeout: 10_000,
  });
  const bar = (Array.isArray(data?.results) ? data.results[0] : null) as PrevBar | null;
  const price = typeof bar?.c === 'number' ? bar.c : NaN;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Massive prev close missing for ${ticker}`);
  }
  return { price, asOfMs: typeof bar?.t === 'number' ? bar.t : null };
}

/**
 * Daily closes as CoinGecko-style `[ms, price][]` pairs for VAPA builders.
 * Basic plan: up to ~2y history; SpaceX only exists from IPO.
 */
export async function fetchMassiveDailyCloses(
  ticker: string,
  fromIsoDay: string,
  toIsoDay: string
): Promise<[number, number][]> {
  const apiKey = massiveApiKey();
  const prices: [number, number][] = [];
  let nextRequestUrl: string | null =
    `${MASSIVE_BASE}/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${fromIsoDay}/${toIsoDay}` +
    `?adjusted=true&sort=asc&limit=50000&apiKey=${encodeURIComponent(apiKey)}`;

  while (nextRequestUrl) {
    const requestUrl: string = nextRequestUrl;
    const { data } = await axios.get(requestUrl, { timeout: 30_000 });
    const payload = data as { results?: DailyBar[]; next_url?: string };
    const bars = Array.isArray(payload.results) ? payload.results : [];
    for (const bar of bars) {
      if (typeof bar?.c === 'number' && typeof bar?.t === 'number' && bar.c > 0) {
        prices.push([bar.t, bar.c]);
      }
    }
    const cursor = typeof payload.next_url === 'string' ? payload.next_url : null;
    nextRequestUrl = cursor
      ? `${cursor}${cursor.includes('?') ? '&' : '?'}apiKey=${encodeURIComponent(apiKey)}`
      : null;
  }

  return prices;
}

/** Ticker overview — market cap + share count for VAPA market-cap series. */
export async function fetchMassiveTickerFundamentals(ticker: string): Promise<{
  marketCap: number | null;
  weightedSharesOutstanding: number | null;
}> {
  const apiKey = massiveApiKey();
  const { data } = await axios.get(`${MASSIVE_BASE}/v3/reference/tickers/${encodeURIComponent(ticker)}`, {
    params: { apiKey },
    timeout: 10_000,
  });
  const results = (data?.results ?? null) as {
    market_cap?: number;
    weighted_shares_outstanding?: number;
  } | null;
  const marketCap =
    typeof results?.market_cap === 'number' && Number.isFinite(results.market_cap) && results.market_cap > 0
      ? results.market_cap
      : null;
  const weightedSharesOutstanding =
    typeof results?.weighted_shares_outstanding === 'number' &&
    Number.isFinite(results.weighted_shares_outstanding) &&
    results.weighted_shares_outstanding > 0
      ? results.weighted_shares_outstanding
      : null;
  return { marketCap, weightedSharesOutstanding };
}

export function defaultHistoryFromDay(): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 2);
  return d.toISOString().slice(0, 10);
}

export function todayUtcDay(): string {
  return new Date().toISOString().slice(0, 10);
}
