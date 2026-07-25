import { CRYPTO_ASSETS } from '../assets/cryptoAssetRegistry';
import { STOCK_ASSETS } from '../assets/stockAssetRegistry';

/** S3 cache key for the asset news snapshot (v6 = apple + alphabet stocks; mirrors analytics/portfolio-context-v1). */
export const ASSET_NEWS_SNAPSHOT_KEY = 'analytics/asset-news-v6/latest.json';

/** Refresh cadence. Paid Basic plan = 2,500 req/day; 15 assets hourly = 360/day. */
export const ASSET_NEWS_TTL_MS = 60 * 60 * 1000;

/** Stories shown per asset. */
export const ASSET_NEWS_ARTICLES_PER_ASSET = 3;

/** Fetched per asset before the title relevance gate trims to ASSET_NEWS_ARTICLES_PER_ASSET. */
export const ASSET_NEWS_FETCH_LIMIT = 10;

/** Only surface articles from the last 7 days. */
export const ASSET_NEWS_MAX_AGE_DAYS = 7;

/** My Investment Updates pagination is by asset group (badge + stories). */
export const ASSET_NEWS_INITIAL_ASSETS = 3;
export const ASSET_NEWS_LOAD_MORE_ASSETS = 3;

/**
 * TheNewsAPI search per asset. `+` = AND, `|` = OR, `-` = NOT.
 * No bare short tickers (eth, ada, doge) — they false-match unrelated words.
 */
export const ASSET_NEWS_QUERIES: Record<string, string> = {
  bitcoin: 'bitcoin -"bitcoin cash"',
  ethereum: 'ethereum',
  xrp: 'xrp | ripple',
  bnb: 'bnb | binance',
  solana: 'solana',
  tron: 'tron + crypto',
  doge: 'dogecoin',
  cardano: 'cardano',
  stellar: 'stellar + (crypto | lumens)',
  bch: '"bitcoin cash"',
  chainlink: 'chainlink',
  nvidia: 'nvidia | nvda',
  apple: 'apple + (aapl | iphone | stock)',
  alphabet: '"alphabet" | google | googl',
  spacex: 'spacex | starlink | starship',
};

/**
 * Title relevance gate: a headline must match one of these word-boundary keywords
 * to count as "about the asset". Articles that fail only fill leftover slots.
 */
export const ASSET_NEWS_TITLE_KEYWORDS: Record<string, string[]> = {
  bitcoin: ['bitcoin', 'btc'],
  ethereum: ['ethereum', 'ether', 'eth'],
  xrp: ['xrp', 'ripple'],
  bnb: ['bnb', 'binance'],
  solana: ['solana', 'sol'],
  tron: ['tron', 'trx'],
  doge: ['dogecoin', 'doge'],
  cardano: ['cardano', 'ada'],
  stellar: ['stellar', 'xlm', 'lumens'],
  bch: ['bitcoin cash', 'bch'],
  chainlink: ['chainlink', 'link token'],
  nvidia: ['nvidia', 'nvda'],
  apple: ['apple', 'aapl', 'iphone'],
  alphabet: ['alphabet', 'google', 'googl'],
  spacex: ['spacex', 'starlink', 'starship', 'falcon'],
};

export const NEWS_SUPPORTED_ASSET_IDS: readonly string[] = [
  ...CRYPTO_ASSETS.map((a) => a.id),
  ...STOCK_ASSETS.map((a) => a.id),
];

/**
 * Reputable-source weighting for the popularity approximation
 * (TheNewsAPI has no native popularity metric). Unlisted domains get DEFAULT_SOURCE_WEIGHT.
 */
export const NEWS_SOURCE_WEIGHTS: Record<string, number> = {
  'reuters.com': 1.0,
  'bloomberg.com': 1.0,
  'wsj.com': 1.0,
  'ft.com': 0.95,
  'cnbc.com': 0.95,
  'forbes.com': 0.9,
  'businessinsider.com': 0.85,
  'yahoo.com': 0.8,
  'finance.yahoo.com': 0.8,
  'marketwatch.com': 0.85,
  'coindesk.com': 0.9,
  'cointelegraph.com': 0.85,
  'theblock.co': 0.85,
  'decrypt.co': 0.8,
  'techcrunch.com': 0.85,
  'theverge.com': 0.8,
  'arstechnica.com': 0.8,
  'space.com': 0.8,
  'nasaspaceflight.com': 0.75,
};

export const DEFAULT_SOURCE_WEIGHT = 0.6;

/**
 * Domain allowlist sent to /news/all (it has no `locale` filter; this keeps results
 * to reputable US/international outlets instead of high-volume junk sources).
 */
export const ASSET_NEWS_DOMAINS = Object.keys(NEWS_SOURCE_WEIGHTS).join(',');

/** Recency half-life used by the popularity score (hours). */
export const NEWS_RECENCY_HALF_LIFE_HOURS = 48;

export type AssetNewsArticle = {
  assetId: string;
  headline: string;
  url: string;
  sourceDomain: string;
  publishedAt: string;
  popularityScore: number;
};

export type AssetNewsSnapshot = {
  generatedAt: number;
  /** assetId → articles, most popular first. */
  articlesByAsset: Record<string, AssetNewsArticle[]>;
};

/** popularity ≈ source reputation x exponential recency decay. */
export function scoreArticlePopularity(sourceDomain: string, publishedAtMs: number, nowMs: number): number {
  const weight = NEWS_SOURCE_WEIGHTS[sourceDomain.toLowerCase()] ?? DEFAULT_SOURCE_WEIGHT;
  const ageHours = Math.max(0, (nowMs - publishedAtMs) / (60 * 60 * 1000));
  const recency = Math.pow(0.5, ageHours / NEWS_RECENCY_HALF_LIFE_HOURS);
  return weight * recency;
}
