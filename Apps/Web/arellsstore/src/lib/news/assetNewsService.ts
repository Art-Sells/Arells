import type AWS from 'aws-sdk';
import {
  ASSET_NEWS_ARTICLES_PER_ASSET,
  ASSET_NEWS_DOMAINS,
  ASSET_NEWS_FETCH_LIMIT,
  ASSET_NEWS_MAX_AGE_DAYS,
  ASSET_NEWS_QUERIES,
  ASSET_NEWS_SNAPSHOT_KEY,
  ASSET_NEWS_TITLE_KEYWORDS,
  ASSET_NEWS_TTL_MS,
  NEWS_SUPPORTED_ASSET_IDS,
  scoreArticlePopularity,
  type AssetNewsArticle,
  type AssetNewsSnapshot,
} from './assetNewsConfig';

/** /news/all with per-asset search: asset-specific coverage (top stories was too sparse/off-topic). */
const THENEWSAPI_BASE = 'https://api.thenewsapi.com/v1/news/all';

let memoryCache: AssetNewsSnapshot | null = null;
let refreshInFlight: Promise<AssetNewsSnapshot> | null = null;

function apiToken(): string {
  return process.env.NEWS_API_KEY?.trim() || '';
}

function emptySnapshot(nowMs: number): AssetNewsSnapshot {
  const articlesByAsset: Record<string, AssetNewsArticle[]> = {};
  for (const assetId of NEWS_SUPPORTED_ASSET_IDS) {
    articlesByAsset[assetId] = [];
  }
  return { generatedAt: nowMs, articlesByAsset };
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Reject publisher homepages / bare domains — only keep real article paths. */
function isArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const path = parsed.pathname.replace(/\/+$/, '');
    return path.length > 0;
  } catch {
    return false;
  }
}

type ProviderArticle = {
  title?: string;
  url?: string;
  source?: string;
  published_at?: string;
  relevance_score?: number | null;
};

/** Word-boundary headline match so short tickers (eth, ada) can't match inside other words. */
function headlineMentionsAsset(headline: string, assetId: string): boolean {
  const keywords = ASSET_NEWS_TITLE_KEYWORDS[assetId] ?? [assetId];
  return keywords.some((keyword) =>
    new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(headline)
  );
}

function sortByPopularity(articles: AssetNewsArticle[]): AssetNewsArticle[] {
  return [...articles].sort((a, b) => b.popularityScore - a.popularityScore);
}

async function queryProvider(
  assetId: string,
  nowMs: number,
  domains: string | null
): Promise<AssetNewsArticle[]> {
  const publishedAfter = new Date(nowMs - ASSET_NEWS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    api_token: apiToken(),
    search: ASSET_NEWS_QUERIES[assetId] ?? assetId,
    search_fields: 'title,description,keywords',
    language: 'en',
    published_after: publishedAfter,
    // Newest first so evergreen high-relevance hits (esp. bitcoin) don't monopolize the pool.
    sort: 'published_at',
    limit: String(ASSET_NEWS_FETCH_LIMIT),
  });
  if (domains) params.set('domains', domains);

  const res = await fetch(`${THENEWSAPI_BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`thenewsapi ${assetId} status ${res.status}`);
  }
  const json = (await res.json()) as { data?: ProviderArticle[] };
  const items = Array.isArray(json.data) ? json.data : [];

  const articles: AssetNewsArticle[] = [];
  for (const item of items) {
    const headline = (item.title || '').trim();
    const url = (item.url || '').trim();
    if (!headline || !url || !isArticleUrl(url)) continue;
    const publishedAtMs = Date.parse(item.published_at || '') || nowMs;
    const sourceDomain = (item.source || domainFromUrl(url) || '').toLowerCase();
    articles.push({
      assetId,
      headline,
      url,
      sourceDomain,
      publishedAt: new Date(publishedAtMs).toISOString(),
      popularityScore: scoreArticlePopularity(sourceDomain, publishedAtMs, nowMs),
    });
  }
  return articles;
}

async function fetchProviderArticlesForAsset(assetId: string, nowMs: number): Promise<AssetNewsArticle[]> {
  // Pass 1: reputable-domain allowlist (/news/all has no locale filter, so this keeps junk sources out).
  // On-topic headlines first (by popularity), then off-topic fill leftover slots.
  const fromAllowlist = await queryProvider(assetId, nowMs, ASSET_NEWS_DOMAINS);
  if (fromAllowlist.length > 0) {
    const onTopic = sortByPopularity(
      fromAllowlist.filter((a) => headlineMentionsAsset(a.headline, assetId))
    );
    const offTopic = sortByPopularity(
      fromAllowlist.filter((a) => !headlineMentionsAsset(a.headline, assetId))
    );
    return [...onTopic, ...offTopic].slice(0, ASSET_NEWS_ARTICLES_PER_ASSET);
  }

  // Pass 2 (sparse assets, e.g. bitcoin cash/chainlink): any source, but strictly
  // on-topic headlines only — unvetted domains don't get the off-topic fill.
  const fromAnywhere = await queryProvider(assetId, nowMs, null);
  return sortByPopularity(fromAnywhere.filter((a) => headlineMentionsAsset(a.headline, assetId))).slice(
    0,
    ASSET_NEWS_ARTICLES_PER_ASSET
  );
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
 * No NEWS_API_KEY → empty snapshot (never mock articles).
 * With a key → provider articles cached in memory + S3 (ASSET_NEWS_SNAPSHOT_KEY) for ASSET_NEWS_TTL_MS.
 *
 * Stale memory/S3 is served immediately while a background refresh runs.
 * Cold start (no cache yet) awaits the provider build.
 */
export async function getAssetNewsSnapshot(
  s3: AWS.S3 | null,
  bucket: string | null,
  nowMs: number = Date.now()
): Promise<AssetNewsSnapshot> {
  if (!apiToken()) {
    return emptySnapshot(nowMs);
  }

  if (memoryCache && isFresh(memoryCache, nowMs)) return memoryCache;

  let stored: AssetNewsSnapshot | null = null;
  if (s3 && bucket) {
    stored = await tryReadSnapshotFromS3(s3, bucket);
    if (stored && isFresh(stored, nowMs)) {
      memoryCache = stored;
      return stored;
    }
  }

  const stale = memoryCache ?? stored;
  if (stale) {
    scheduleBackgroundRefresh(s3, bucket, nowMs);
    memoryCache = stale;
    return stale;
  }

  return ensureProviderSnapshot(s3, bucket, nowMs);
}

function ensureProviderSnapshot(
  s3: AWS.S3 | null,
  bucket: string | null,
  nowMs: number
): Promise<AssetNewsSnapshot> {
  if (!refreshInFlight) {
    const pending = (async () => {
      const snapshot = await buildSnapshotFromProvider(nowMs);
      memoryCache = snapshot;
      if (s3 && bucket) await writeSnapshotToS3(s3, bucket, snapshot);
      return snapshot;
    })();
    refreshInFlight = pending;
    void pending.finally(() => {
      if (refreshInFlight === pending) refreshInFlight = null;
    });
  }
  return refreshInFlight as Promise<AssetNewsSnapshot>;
}

function scheduleBackgroundRefresh(
  s3: AWS.S3 | null,
  bucket: string | null,
  nowMs: number
): void {
  void ensureProviderSnapshot(s3, bucket, nowMs);
}
