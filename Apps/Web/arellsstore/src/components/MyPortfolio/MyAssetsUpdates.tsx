'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import AssetSummaryCircleLoader from '../Assets/shared/AssetSummaryCircleLoader';
import { useAssetSummaryCircleLoader } from '../Assets/shared/useAssetSummaryCircleLoader';
import MyInvAssetBadgeGrid from '../MyInvestments/MyInvAssetBadgeGrid';
import {
  ASSET_NEWS_ARTICLES_PER_ASSET,
  ASSET_NEWS_INITIAL_ASSETS,
  ASSET_NEWS_LOAD_MORE_ASSETS,
  type AssetNewsArticle,
  type AssetNewsSnapshot,
} from '../../lib/news/assetNewsConfig';

/** Mount height-down duration (matches My Investments summary SUMMARY_HEIGHT_EXPAND_MS). */
const NEWS_HEIGHT_EXPAND_MS = 3000;
/** Gathering section height; expand starts from here (not 0). */
const NEWS_LOADER_SECTION_HEIGHT_PX = 50;
/** Safety: never leave the in-panel circle spinning if news/holdings stall. */
const NEWS_FETCH_TIMEOUT_MS = 12_000;

/** Empty-portfolio mode paginates by headline (same visual total as 3 asset groups x 3 stories). */
const NEWS_DISCOVER_INITIAL_HEADLINES = 9;
const NEWS_DISCOVER_LOAD_MORE_HEADLINES = 9;
/** Flex-item word groups — match working portfolio text-chunks (short separate boxes for Safari). */
const NEWS_HEADLINE_FLEX_WORDS = 3;

type AssetNewsGroup = {
  assetId: string;
  articles: AssetNewsArticle[];
};

/** Split an API headline into short flex children (same cluster break as pre-rendered text-chunks). */
function splitHeadlineChunks(headline: string): string[] {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  if (words.length <= NEWS_HEADLINE_FLEX_WORDS) {
    return words.length ? [words.join(' ')] : [];
  }
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += NEWS_HEADLINE_FLEX_WORDS) {
    chunks.push(words.slice(i, i + NEWS_HEADLINE_FLEX_WORDS).join(' '));
  }
  return chunks;
}

const MyAssetsUpdates: React.FC = () => {
  const { emailInvestments, emailInvestmentsReady, isSignedIn } = useUser();
  const [articlesByAsset, setArticlesByAsset] = useState<Record<string, AssetNewsArticle[]> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [visibleAssetCount, setVisibleAssetCount] = useState(ASSET_NEWS_INITIAL_ASSETS);
  const [visibleHeadlineCount, setVisibleHeadlineCount] = useState(NEWS_DISCOVER_INITIAL_HEADLINES);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelHeight, setPanelHeight] = useState(NEWS_LOADER_SECTION_HEIGHT_PX);
  const [contentReveal, setContentReveal] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const showedLoaderRef = useRef(false);
  const {
    mounted: circleMounted,
    visible: circleVisible,
    fadingOut: circleFadingOut,
    show: showCircleLoader,
    dismissOnSummaryExpandComplete: dismissCircleLoader,
    dismissImmediately: dismissCircleLoaderNow,
  } = useAssetSummaryCircleLoader();

  // Same race as the page title: don't pick empty-portfolio (discover) mode until holdings are known.
  const investmentsPending = isSignedIn && !emailInvestmentsReady;
  const hasInvestments = emailInvestments.length > 0;
  const gathering = !loadError && (investmentsPending || articlesByAsset === null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);
    (async () => {
      try {
        const res = await fetch('/api/portfolio/news', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('news fetch failed');
        const json = (await res.json()) as AssetNewsSnapshot;
        if (!cancelled) {
          setArticlesByAsset(json.articlesByAsset ?? {});
          setLoadError(false);
        }
      } catch {
        if (!cancelled) {
          // Timeout/network: unblock the loader (empty list → "No updates yet" if holdings ready).
          setArticlesByAsset({});
          setLoadError(true);
        }
      } finally {
        globalThis.clearTimeout(timeoutId);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      globalThis.clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Every held asset, largest current value first (same source values as the
   * My Investments badge order). Assets whose lots have no cVact yet still count:
   * units (cVactTaa), then lot count, break ties so nothing is dropped.
   */
  const heldAssetsSorted = useMemo(() => {
    const byAsset = new Map<string, { usd: number; units: number; lots: number }>();
    for (const inv of emailInvestments) {
      const id = String(inv?.asset || 'bitcoin').toLowerCase();
      const entry = byAsset.get(id) ?? { usd: 0, units: 0, lots: 0 };
      entry.usd += Number(inv?.cVact) || 0;
      entry.units += Number(inv?.cVactTaa) || 0;
      entry.lots += 1;
      byAsset.set(id, entry);
    }
    return [...byAsset.entries()]
      .sort((a, b) => b[1].usd - a[1].usd || b[1].units - a[1].units || b[1].lots - a[1].lots)
      .map(([assetId]) => assetId);
  }, [emailInvestments]);

  /** One group per held asset (badge + its stories); only assets with zero articles are skipped. */
  const assetGroups = useMemo<AssetNewsGroup[]>(() => {
    if (!articlesByAsset || !hasInvestments) return [];
    return heldAssetsSorted
      .map((assetId) => ({
        assetId,
        articles: (articlesByAsset[assetId] ?? []).slice(0, ASSET_NEWS_ARTICLES_PER_ASSET),
      }))
      .filter((group) => group.articles.length > 0);
  }, [articlesByAsset, heldAssetsSorted, hasInvestments]);

  /**
   * Empty portfolio: flat headline list across ALL assets, interleaved for diversity —
   * assets ordered by their most popular story, then round-robin (every asset's #1
   * story first, then every #2, then every #3) so one asset never stacks over another.
   */
  const discoverArticles = useMemo<AssetNewsArticle[]>(() => {
    if (!articlesByAsset || investmentsPending || hasInvestments) return [];
    const perAsset = Object.values(articlesByAsset)
      .map((articles) => (articles ?? []).slice(0, ASSET_NEWS_ARTICLES_PER_ASSET))
      .filter((articles) => articles.length > 0)
      .sort((a, b) => (b[0]?.popularityScore ?? 0) - (a[0]?.popularityScore ?? 0));
    const interleaved: AssetNewsArticle[] = [];
    for (let round = 0; round < ASSET_NEWS_ARTICLES_PER_ASSET; round += 1) {
      for (const articles of perAsset) {
        if (articles[round]) interleaved.push(articles[round]);
      }
    }
    return interleaved;
  }, [articlesByAsset, investmentsPending, hasInvestments]);

  useEffect(() => {
    setVisibleAssetCount(ASSET_NEWS_INITIAL_ASSETS);
    setVisibleHeadlineCount(NEWS_DISCOVER_INITIAL_HEADLINES);
  }, [assetGroups.length, discoverArticles.length]);

  const contentReady =
    !investmentsPending &&
    articlesByAsset !== null &&
    (hasInvestments ? assetGroups.length > 0 : discoverArticles.length > 0);

  useEffect(() => {
    if (gathering) {
      showedLoaderRef.current = true;
      setContentReveal(false);
      showCircleLoader();
      return;
    }
    if (contentReady) {
      if (showedLoaderRef.current) {
        dismissCircleLoader();
        let raf2 = 0;
        const raf1 = globalThis.requestAnimationFrame(() => {
          raf2 = globalThis.requestAnimationFrame(() => setContentReveal(true));
        });
        return () => {
          globalThis.cancelAnimationFrame(raf1);
          if (raf2) globalThis.cancelAnimationFrame(raf2);
        };
      }
      setContentReveal(true);
      dismissCircleLoaderNow();
      return;
    }
    setContentReveal(false);
    dismissCircleLoaderNow();
  }, [gathering, contentReady, showCircleLoader, dismissCircleLoader, dismissCircleLoaderNow]);

  // Gathering: lock section at 50px. Ready: height-down from 50px → measured content.
  useLayoutEffect(() => {
    if (!contentReady) {
      setPanelOpen(true);
      setPanelHeight(NEWS_LOADER_SECTION_HEIGHT_PX);
      return;
    }

    setPanelOpen(true);
    setPanelHeight(NEWS_LOADER_SECTION_HEIGHT_PX);

    let cancelled = false;
    let raf2 = 0;
    const raf1 = globalThis.requestAnimationFrame(() => {
      raf2 = globalThis.requestAnimationFrame(() => {
        if (cancelled) return;
        const next = contentRef.current?.scrollHeight ?? NEWS_LOADER_SECTION_HEIGHT_PX;
        setPanelHeight(Math.max(NEWS_LOADER_SECTION_HEIGHT_PX, next));
      });
    });
    return () => {
      cancelled = true;
      globalThis.cancelAnimationFrame(raf1);
      if (raf2) globalThis.cancelAnimationFrame(raf2);
    };
  }, [contentReady]);

  // Keep measured height in sync while open (show more / show less, wrapped headlines).
  useEffect(() => {
    if (!contentReady || !panelOpen) return;
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const measure = () => {
      raf = globalThis.requestAnimationFrame(() => {
        const next = Math.max(NEWS_LOADER_SECTION_HEIGHT_PX, node.scrollHeight);
        setPanelHeight((prev) => (prev === next ? prev : next));
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) globalThis.cancelAnimationFrame(raf);
    };
  }, [contentReady, panelOpen]);

  const showCircle = gathering || circleMounted;
  const circleIsVisible = gathering || circleVisible;

  const canPaginate = hasInvestments
    ? assetGroups.length > ASSET_NEWS_INITIAL_ASSETS
    : discoverArticles.length > NEWS_DISCOVER_INITIAL_HEADLINES;
  const visibleGroups = canPaginate ? assetGroups.slice(0, visibleAssetCount) : assetGroups;
  const visibleDiscover = canPaginate ? discoverArticles.slice(0, visibleHeadlineCount) : discoverArticles;
  const hasMore = hasInvestments
    ? visibleAssetCount < assetGroups.length
    : visibleHeadlineCount < discoverArticles.length;

  const onPaginateClick = useCallback(() => {
    if (hasMore) {
      if (hasInvestments) {
        setVisibleAssetCount((count) => Math.min(count + ASSET_NEWS_LOAD_MORE_ASSETS, assetGroups.length));
      } else {
        setVisibleHeadlineCount((count) =>
          Math.min(count + NEWS_DISCOVER_LOAD_MORE_HEADLINES, discoverArticles.length)
        );
      }
    } else if (hasInvestments) {
      setVisibleAssetCount(ASSET_NEWS_INITIAL_ASSETS);
    } else {
      setVisibleHeadlineCount(NEWS_DISCOVER_INITIAL_HEADLINES);
    }
  }, [hasMore, hasInvestments, assetGroups.length, discoverArticles.length]);

  const renderHeadlineCard = (article: AssetNewsArticle) => {
    const chunks = splitHeadlineChunks(article.headline);
    return (
      <a
        key={`${article.assetId}-${article.url}-${article.headline}`}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`myinv-asset-home-card home-asset-${article.assetId} myportfolio-news-card`}
      >
        <span className="myportfolio-news-headline myportfolio-text-chunks">
          {chunks.map((chunk, index) => (
            <span key={`${article.url}-${index}`}>{chunk}</span>
          ))}
        </span>
      </a>
    );
  };

  if (loadError) {
    return (
      <button
        type="button"
        className="asset-range-button myinv-range-button about-cta-button myportfolio-learn-more"
        onClick={() => {
          window.location.reload();
        }}
      >
        click to reload updates
      </button>
    );
  }

  if (!gathering && !contentReady && articlesByAsset !== null) {
    return <p className="myportfolio-leaderboard-empty">No updates yet.</p>;
  }

  return (
    <div
      className={`myportfolio-news-panel${gathering ? ' is-gathering' : ''}${
        showCircle && contentReady ? ' is-revealing' : ''
      }`}
      style={{
        overflow: 'hidden',
        maxHeight: panelOpen ? `${panelHeight}px` : `${NEWS_LOADER_SECTION_HEIGHT_PX}px`,
        transition: `max-height ${NEWS_HEIGHT_EXPAND_MS}ms ease`,
      }}
    >
      {contentReady ? (
        <div
          ref={contentRef}
          className={`asset-mount-fade-2s${contentReveal ? ' is-visible' : ''}`}
          aria-hidden={!contentReveal}
        >
          {hasInvestments ? (
            visibleGroups.map((group) => (
              <div key={group.assetId} className="myportfolio-news-group myinv-accent-border">
                <div className="myportfolio-news-group-badge">
                  <MyInvAssetBadgeGrid assets={[group.assetId]} linkKeyPrefix={`news-${group.assetId}`} />
                </div>
                <div className="myportfolio-news-nested myinv-accent-border">
                  <div className="myportfolio-news-list">{group.articles.map(renderHeadlineCard)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="myportfolio-news-list">{visibleDiscover.map(renderHeadlineCard)}</div>
          )}
          {canPaginate ? (
            <button
              type="button"
              className="asset-range-button myinv-range-button about-cta-button myportfolio-leaderboard-show-more"
              onClick={onPaginateClick}
            >
              {hasMore ? 'show more' : 'show less'}
            </button>
          ) : null}
        </div>
      ) : null}
      {showCircle ? (
        <div
          className={`myportfolio-news-loader-slot${contentReady ? ' is-overlay' : ''}`}
          aria-busy={gathering}
          aria-hidden={!gathering}
          aria-label={gathering ? 'Loading investment updates' : undefined}
        >
          <AssetSummaryCircleLoader
            cssModifier="portfolio-news"
            mounted
            visible={circleIsVisible}
            fadingOut={circleFadingOut}
          />
        </div>
      ) : null}
    </div>
  );
};

export default MyAssetsUpdates;
