import type AWS from 'aws-sdk';
import {
  ASSET_NEWS_ARTICLES_PER_ASSET,
  ASSET_NEWS_LOCALE,
  ASSET_NEWS_MAX_AGE_DAYS,
  ASSET_NEWS_QUERIES,
  ASSET_NEWS_SNAPSHOT_KEY,
  ASSET_NEWS_TTL_MS,
  NEWS_SUPPORTED_ASSET_IDS,
  type AssetNewsArticle,
  type AssetNewsSnapshot,
} from './assetNewsConfig';
import { buildMockAssetNewsSnapshot } from './mockAssetNews';

/** Top stories endpoint: only articles TheNewsAPI designates as top stories. */
const THENEWSAPI_BASE = 'https://api.thenewsapi.com/v1/news/top';

let memoryCache: AssetNewsSnapshot | null = null;
let refreshInFlight: Promise<AssetNewsSnapshot> | null = null;

function apiToken(): string {
  return process.env.NEWS_API_KEY?.trim() || '';
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

type ProviderArticle = {
  title?: string;
  url?: string;
  source?: string;
  published_at?: string;
  relevance_score?: number | null;
};

async function fetchProviderArticlesForAsset(assetId: string, nowMs: number): Promise<AssetNewsArticle[]> {
  const publishedAfter = new Date(nowMs - ASSET_NEWS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    api_token: apiToken(),
    search: ASSET_NEWS_QUERIES[assetId] ?? assetId,
    search_fields: 'title,description,keywords',
    // Without a locale filter, /news/top skews to high-volume international English outlets (e.g. India).
    locale: ASSET_NEWS_LOCALE,
    language: 'en',
    published_after: publishedAfter,
    sort: 'relevance_score',
    limit: String(ASSET_NEWS_ARTICLES_PER_ASSET),
  });

  const res = await fetch(`${THENEWSAPI_BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`thenewsapi ${assetId} status ${res.status}`);
  }
  const json = (await res.json()) as { data?: ProviderArticle[] };
  const items = Array.isArray(json.data) ? json.data : [];

  // Preserve the provider's order: top stories ranked by relevance_score.
  const articles: AssetNewsArticle[] = [];
  items.forEach((item, index) => {
    const headline = (item.title || '').trim();
    const url = (item.url || '').trim();
    if (!headline || !url) return;
    const publishedAtMs = Date.parse(item.published_at || '') || nowMs;
    const sourceDomain = (item.source || domainFromUrl(url) || '').toLowerCase();
    articles.push({
      assetId,
      headline,
      url,
      sourceDomain,
      publishedAt: new Date(publishedAtMs).toISOString(),
      popularityScore:
        typeof item.relevance_score === 'number' ? item.relevance_score : items.length - index,
    });
  });
  return articles;
}

async function buildSnapshotFromProvider(nowMs: number): Promise<AssetNewsSnapshot> {
  const articlesByAsset: Record<string, AssetNewsArticle[]> = {};
  // Sequential to stay far below the provider's per-minute rate limit.
  for (const assetId of NEWS_SUPPORTED_ASSET_IDS) {
    try {
      articlesByAsset[assetId] = await fetchProviderArticlesForAsset(assetId, nowMs);
    } catch (e) {
      console.error('[asset-news] fetch', assetId, e);
      articlesByAsset[assetId] = [];
    }
  }
  return { generatedAt: nowMs, articlesByAsset };
}

function isValidSnapshot(value: unknown): value is AssetNewsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as AssetNewsSnapshot;
  return typeof v.generatedAt === 'number' && v.articlesByAsset != null && typeof v.articlesByAsset === 'object';
}

async function tryReadSnapshotFromS3(s3: AWS.S3, bucket: string): Promise<AssetNewsSnapshot | null> {
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: ASSET_NEWS_SNAPSHOT_KEY }).promise();
    if (!obj.Body) return null;
    const parsed = JSON.parse(obj.Body.toString()) as unknown;
    return isValidSnapshot(parsed) ? parsed : null;
  } catch (e: unknown) {
    const err = e as { code?: string; statusCode?: number };
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    console.error('[asset-news] s3 get', e);
    return null;
  }
}

async function writeSnapshotToS3(s3: AWS.S3, bucket: string, snapshot: AssetNewsSnapshot): Promise<void> {
  if (process.env.S3_WRITE_DISABLED === '1') return;
  try {
    await s3
      .putObject({
        Bucket: bucket,
        Key: ASSET_NEWS_SNAPSHOT_KEY,
        Body: JSON.stringify(snapshot),
        ContentType: 'application/json',
      })
      .promise();
  } catch (e) {
    console.error('[asset-news] s3 put', e);
  }
}

function isFresh(snapshot: AssetNewsSnapshot, nowMs: number): boolean {
  return nowMs - snapshot.generatedAt < ASSET_NEWS_TTL_MS;
}

/**
 * Cached asset news for all supported assets, most popular first per asset.
 * No NEWS_API_KEY (e.g. localhost) → deterministic mock articles.
 * With a key → provider articles cached in memory + S3 (analytics/asset-news-v1) for ASSET_NEWS_TTL_MS.
 */
export async function getAssetNewsSnapshot(
  s3: AWS.S3 | null,
  bucket: string | null,
  nowMs: number = Date.now()
): Promise<AssetNewsSnapshot> {
  if (!apiToken()) {
    return buildMockAssetNewsSnapshot(nowMs);
  }

  if (memoryCache && isFresh(memoryCache, nowMs)) return memoryCache;

  if (s3 && bucket) {
    const stored = await tryReadSnapshotFromS3(s3, bucket);
    if (stored && isFresh(stored, nowMs)) {
      memoryCache = stored;
      return stored;
    }
  }

  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const snapshot = await buildSnapshotFromProvider(nowMs);
    memoryCache = snapshot;
    if (s3 && bucket) await writeSnapshotToS3(s3, bucket, snapshot);
    return snapshot;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
