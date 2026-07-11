import axios from 'axios';
import { MARKET_CATALOG_STOCK_LIMIT } from './marketCatalogTypes';

export type NasdaqStockRow = {
  symbol: string;
  name: string;
  marketCapUsd: number;
  country: string;
  sector: string;
  industry: string;
};

const NASDAQ_SCREENER_URL =
  'https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=7124&offset=0&download=true';

/** Known bad or misleading tickers in the free Nasdaq feed. */
const STOCK_SYMBOL_DENYLIST = new Set(['SPCX']);

const ETF_FUND_NAME_PATTERNS = [
  ' ETF',
  ' EXCHANGE TRADED FUND',
  ' ETN ',
  ' INDEX FUND',
  ' MUTUAL FUND',
  ' PROSHARES',
  ' SPDR ',
  ' ISHARES',
  ' INVESCO ',
  ' VANGUARD ',
  ' WISDOMTREE',
  ' GRANITESHARES',
  ' DIREXION',
  ' GLOBAL X',
  ' FIRST TRUST',
  ' AMPLIFY ',
  ' ARK ETF',
  ' ETF TRUST',
  ' FUND INC.',
  ' FUND, INC.',
  ' CLOSED END FUND',
  ' UNIT INVESTMENT TRUST',
];

function parseMarketCap(raw: string | number | undefined): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  if (typeof raw !== 'string') return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function normalizeCompanyKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+class\s+[a-z]\s+/gi, ' ')
    .replace(/\s+common\s+stock\s*$/i, '')
    .replace(/\s+capital\s+stock\s*$/i, '')
    .replace(/\s+depositary\s+shares.*/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isLikelyEtfOrFund(name: string): boolean {
  const upper = name.toUpperCase();
  return ETF_FUND_NAME_PATTERNS.some((p) => upper.includes(p));
}

type NasdaqApiRow = {
  symbol?: string;
  name?: string;
  marketCap?: string;
  country?: string;
  sector?: string;
  industry?: string;
};

export async function fetchNasdaqStockUniverse(limit = MARKET_CATALOG_STOCK_LIMIT): Promise<NasdaqStockRow[]> {
  const { data } = await axios.get<{ data?: { rows?: NasdaqApiRow[] } }>(NASDAQ_SCREENER_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ArellsMarketCatalog/1.0)',
      Accept: 'application/json',
    },
    timeout: 60_000,
  });

  const rows = data?.data?.rows ?? [];
  const usOperating: NasdaqStockRow[] = [];

  for (const row of rows) {
    const symbol = (row.symbol ?? '').trim().toUpperCase();
    const name = (row.name ?? '').trim();
    if (!symbol || !name) continue;
    if (STOCK_SYMBOL_DENYLIST.has(symbol)) continue;
    if ((row.country ?? '').trim().toLowerCase() !== 'united states') continue;

    const marketCapUsd = parseMarketCap(row.marketCap);
    if (marketCapUsd <= 0) continue;
    if (isLikelyEtfOrFund(name)) continue;

    usOperating.push({
      symbol,
      name,
      marketCapUsd,
      country: row.country ?? '',
      sector: row.sector ?? '',
      industry: row.industry ?? '',
    });
  }

  usOperating.sort((a, b) => b.marketCapUsd - a.marketCapUsd);

  const deduped: NasdaqStockRow[] = [];
  const seenCompany = new Set<string>();

  for (const row of usOperating) {
    const key = normalizeCompanyKey(row.name);
    if (!key || seenCompany.has(key)) continue;
    seenCompany.add(key);
    deduped.push(row);
    if (deduped.length >= limit) break;
  }

  return deduped;
}
