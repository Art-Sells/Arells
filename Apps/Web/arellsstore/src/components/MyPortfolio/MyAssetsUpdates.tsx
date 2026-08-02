'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useMyInvEngagementEvent } from '../../hooks/useMyInvEngagementEvent';
import AssetSummaryCircleLoader from '../Assets/shared/AssetSummaryCircleLoader';
import { useAssetSummaryCircleLoader } from '../Assets/shared/useAssetSummaryCircleLoader';
import MyInvAssetBadgeGrid from '../MyInvestments/MyInvAssetBadgeGrid';
import { getAnyAssetMeta } from '../../lib/assets/assetKind';
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
/** Minimum circle time so mode (My vs discover) never flashes in before holdings settle. */
const NEWS_MIN_LOADER_MS = 2000;

/** Empty-portfolio mode paginates by headline (same visual total as 3 asset groups x 3 stories). */
const NEWS_DISCOVER_INITIAL_HEADLINES = 9;
const NEWS_DISCOVER_LOAD_MORE_HEADLINES = 9;

type AssetNewsGroup = {
  assetId: string;
  articles: AssetNewsArticle[];
};

type MyAssetsUpdatesProps = {
  /** Parent gate: auth/SSR/aggregator still resolving — do not pick My vs discover yet. */
  holdingsPending?: boolean;
};

/** Card label: "Jul 21, 2026 · 3:42 PM" from article.publishedAt. */
function formatArticlePublishedAt(publishedAt: string): string {
  const ms = Date.parse(publishedAt);
  if (!Number.isFinite(ms)) return '—';
  const date = new Date(ms);
  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

function elementOuterHeight(el: HTMLElement): number {
  const cs = globalThis.getComputedStyle(el);
  return (
    el.offsetHeight +
    (Number.parseFloat(cs.marginTop) || 0) +
    (Number.parseFloat(cs.marginBottom) || 0)
  );
}

/** Height of the first `initialCount` items inside `content` (relative to content top). */
function measureInitialItemsHeight(
  content: HTMLElement,
  itemSelector: string,
  initialCount: number
): number {
  const items = content.querySelectorAll(itemSelector);
  const n = Math.min(initialCount, items.length);
  if (n <= 0) return 0;
  const contentTop = content.getBoundingClientRect().top;
  const last = items[n - 1] as HTMLElement;
  return Math.ceil(last.getBoundingClientRect().bottom - contentTop);
}

const MyAssetsUpdates: React.FC<MyAssetsUpdatesProps> = ({ holdingsPending = false }) => {
  const { emailInvestments, isSignedIn } = useUser();
  const { recordEngagement } = useMyInvEngagementEvent();
  const [articlesByAsset, setArticlesByAsset] = useState<Record<string, AssetNewsArticle[]> | null>(null);
  const [loadError, setLoadError] = useState(false);
  /** How many items are mounted — only grows on "show more"; never shrinks on "show less". */
  const [revealedAssetCount, setRevealedAssetCount] = useState(ASSET_NEWS_INITIAL_ASSETS);
  const [revealedHeadlineCount, setRevealedHeadlineCount] = useState(NEWS_DISCOVER_INITIAL_HEADLINES);
  /** False = height-clipped to the first page; extras stay mounted under overflow. */
  const [listExpanded, setListExpanded] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelHeight, setPanelHeight] = useState(NEWS_LOADER_SECTION_HEIGHT_PX);
  const [contentReveal, setContentReveal] = useState(false);
  const [minLoaderElapsed, setMinLoaderElapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const showMoreBtnRef = useRef<HTMLButtonElement | null>(null);
  const listExpandedRef = useRef(true);
  const showedLoaderRef = useRef(false);
  const {
    mounted: circleMounted,
    visible: circleVisible,
    fadingOut: circleFadingOut,
    show: showCircleLoader,
    dismissOnSummaryExpandComplete: dismissCircleLoader,
    dismissImmediately: dismissCircleLoaderNow,
  } = useAssetSummaryCircleLoader();

  const hasInvestments = emailInvestments.length > 0;
  // Gate mode until holdings are known; also keep the circle up for a minimum mount time.
  const gathering =
    !loadError && (holdingsPending || articlesByAsset === null || !minLoaderElapsed);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setMinLoaderElapsed(true), NEWS_MIN_LOADER_MS);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

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
    if (!articlesByAsset || holdingsPending || !hasInvestments) return [];
    return heldAssetsSorted
      .map((assetId) => ({
        assetId,
        articles: (articlesByAsset[assetId] ?? []).slice(0, ASSET_NEWS_ARTICLES_PER_ASSET),
      }))
      .filter((group) => group.articles.length > 0);
  }, [articlesByAsset, heldAssetsSorted, hasInvestments, holdingsPending]);

  /**
   * Empty portfolio: flat headline list across ALL assets, interleaved for diversity —
   * assets ordered by their most popular story, then round-robin (every asset's #1
   * story first, then every #2, then every #3) so one asset never stacks over another.
   */
  const discoverArticles = useMemo<AssetNewsArticle[]>(() => {
    if (!articlesByAsset || holdingsPending || hasInvestments) return [];
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
  }, [articlesByAsset, holdingsPending, hasInvestments]);

  useEffect(() => {
    setRevealedAssetCount(ASSET_NEWS_INITIAL_ASSETS);
    setRevealedHeadlineCount(NEWS_DISCOVER_INITIAL_HEADLINES);
    listExpandedRef.current = true;
    setListExpanded(true);
  }, [assetGroups.length, discoverArticles.length]);

  const contentReady =
    !holdingsPending &&
    minLoaderElapsed &&
    articlesByAsset !== null &&
    (hasInvestments ? assetGroups.length > 0 : discoverArticles.length > 0);

  const canPaginate = hasInvestments
    ? assetGroups.length > ASSET_NEWS_INITIAL_ASSETS
    : discoverArticles.length > NEWS_DISCOVER_INITIAL_HEADLINES;
  const revealedGroups = canPaginate ? assetGroups.slice(0, revealedAssetCount) : assetGroups;
  const revealedDiscover = canPaginate
    ? discoverArticles.slice(0, revealedHeadlineCount)
    : discoverArticles;
  const hasUnrevealed = hasInvestments
    ? revealedAssetCount < assetGroups.length
    : revealedHeadlineCount < discoverArticles.length;
  /** Collapsed, or expanded with more batches left → "show more"; fully expanded → "show less". */
  const showMoreLabel = !listExpanded || hasUnrevealed;

  const measurePanelHeight = useCallback(
    (expanded: boolean) => {
      const content = contentRef.current;
      if (!content) return NEWS_LOADER_SECTION_HEIGHT_PX;
      const btn = showMoreBtnRef.current;
      const btnH = btn ? elementOuterHeight(btn) : 0;
      if (expanded) {
        return Math.max(NEWS_LOADER_SECTION_HEIGHT_PX, content.scrollHeight + btnH);
      }
      const initialCount = hasInvestments
        ? ASSET_NEWS_INITIAL_ASSETS
        : NEWS_DISCOVER_INITIAL_HEADLINES;
      const itemSelector = hasInvestments
        ? '.myportfolio-news-group'
        : '.myportfolio-news-list > .myportfolio-news-headline';
      const itemsH = measureInitialItemsHeight(content, itemSelector, initialCount);
      return Math.max(NEWS_LOADER_SECTION_HEIGHT_PX, itemsH + btnH);
    },
    [hasInvestments]
  );

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

    listExpandedRef.current = true;
    setListExpanded(true);
    setPanelOpen(true);
    setPanelHeight(NEWS_LOADER_SECTION_HEIGHT_PX);

    let cancelled = false;
    let raf2 = 0;
    const raf1 = globalThis.requestAnimationFrame(() => {
      raf2 = globalThis.requestAnimationFrame(() => {
        if (cancelled) return;
        setPanelHeight(measurePanelHeight(true));
      });
    });
    return () => {
      cancelled = true;
      globalThis.cancelAnimationFrame(raf1);
      if (raf2) globalThis.cancelAnimationFrame(raf2);
    };
  }, [contentReady, measurePanelHeight]);

  // Keep measured height in sync (wrap/font changes). Respect collapsed clip.
  useEffect(() => {
    if (!contentReady || !panelOpen) return;
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const measure = () => {
      raf = globalThis.requestAnimationFrame(() => {
        const next = measurePanelHeight(listExpandedRef.current);
        setPanelHeight((prev) => (prev === next ? prev : next));
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) globalThis.cancelAnimationFrame(raf);
    };
  }, [contentReady, panelOpen, measurePanelHeight, revealedAssetCount, revealedHeadlineCount]);

  const showCircle = gathering || circleMounted;
  const circleIsVisible = gathering || circleVisible;

  const onPaginateClick = useCallback(() => {
    if (!listExpandedRef.current) {
      // Re-expand; keep every already-revealed update mounted.
      listExpandedRef.current = true;
      setListExpanded(true);
      setPanelHeight(measurePanelHeight(true));
      return;
    }
    if (hasUnrevealed) {
      if (hasInvestments) {
        setRevealedAssetCount((count) =>
          Math.min(count + ASSET_NEWS_LOAD_MORE_ASSETS, assetGroups.length)
        );
      } else {
        setRevealedHeadlineCount((count) =>
          Math.min(count + NEWS_DISCOVER_LOAD_MORE_HEADLINES, discoverArticles.length)
        );
      }
      return;
    }
    // Show less: clip height only — do not unmount revealed updates.
    const full = measurePanelHeight(true);
    const collapsed = measurePanelHeight(false);
    setPanelHeight(full);
    listExpandedRef.current = false;
    setListExpanded(false);
    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(() => {
        setPanelHeight(collapsed);
      });
    });
  }, [
    hasUnrevealed,
    hasInvestments,
    assetGroups.length,
    discoverArticles.length,
    measurePanelHeight,
  ]);

  const renderHeadlineCard = (article: AssetNewsArticle) => (
    <a
      key={`${article.assetId}-${article.url}-${article.headline}`}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`myinv-asset-home-card home-asset-${article.assetId} myportfolio-news-card myportfolio-news-headline`}
      title={article.headline}
      onClick={() => {
        if (isSignedIn) recordEngagement('investment_update_click');
      }}
    >
      {formatArticlePublishedAt(article.publishedAt)}
    </a>
  );

  /** Discover / Investment Updates: asset badge left of the published date. */
  const renderDiscoverCard = (article: AssetNewsArticle) => {
    const label = getAnyAssetMeta(article.assetId)?.label ?? article.assetId;
    return (
      <a
        key={`${article.assetId}-${article.url}-${article.headline}`}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`myinv-asset-home-card home-asset-${article.assetId} myportfolio-news-card myportfolio-news-headline myportfolio-news-headline--with-badge`}
        title={article.headline}
        onClick={() => {
          if (isSignedIn) recordEngagement('investment_update_click');
        }}
      >
        <span className="myportfolio-news-headline-badge" aria-hidden="true">
          <span
            className={`home-asset-name asset-action-button asset-action-button--${article.assetId} asset-action-button--home-asset-chip`}
          >
            {label}
          </span>
        </span>
        <span className="myportfolio-news-headline-date">
          {formatArticlePublishedAt(article.publishedAt)}
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
      }${!listExpanded ? ' is-collapsed' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: panelOpen ? `${panelHeight}px` : `${NEWS_LOADER_SECTION_HEIGHT_PX}px`,
        transition: `height ${NEWS_HEIGHT_EXPAND_MS}ms ease`,
      }}
    >
      {contentReady ? (
        <>
          <div className="myportfolio-news-clip">
            <div
              ref={contentRef}
              className={`asset-mount-fade-2s${contentReveal ? ' is-visible' : ''}`}
              aria-hidden={!contentReveal}
            >
              {hasInvestments ? (
                revealedGroups.map((group) => (
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
                <div className="myportfolio-news-list">{revealedDiscover.map(renderDiscoverCard)}</div>
              )}
            </div>
          </div>
          {canPaginate ? (
            <button
              ref={showMoreBtnRef}
              type="button"
              className="asset-range-button myinv-range-button about-cta-button myportfolio-leaderboard-show-more"
              onClick={onPaginateClick}
            >
              {showMoreLabel ? 'show more' : 'show less'}
            </button>
          ) : null}
        </>
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
