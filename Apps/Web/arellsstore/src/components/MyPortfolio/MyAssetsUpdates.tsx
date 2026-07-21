'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
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

type AssetNewsGroup = {
  assetId: string;
  articles: AssetNewsArticle[];
};

const MyAssetsUpdates: React.FC = () => {
  const { emailInvestments } = useUser();
  const [articlesByAsset, setArticlesByAsset] = useState<Record<string, AssetNewsArticle[]> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [visibleAssetCount, setVisibleAssetCount] = useState(ASSET_NEWS_INITIAL_ASSETS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/portfolio/news', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error('news fetch failed');
        const json = (await res.json()) as AssetNewsSnapshot;
        if (!cancelled) {
          setArticlesByAsset(json.articlesByAsset ?? {});
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Largest current holding first (same source values as My Investments badge order). */
  const holdingsUsdByAsset = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const inv of emailInvestments) {
      const id = String(inv?.asset || 'bitcoin').toLowerCase();
      totals[id] = (totals[id] || 0) + (Number(inv?.cVact) || 0);
    }
    return totals;
  }, [emailInvestments]);

  /** One group per held asset (badge + its top stories), ranked by holding value. */
  const assetGroups = useMemo<AssetNewsGroup[]>(() => {
    if (!articlesByAsset) return [];
    return Object.entries(holdingsUsdByAsset)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([assetId]) => ({
        assetId,
        articles: (articlesByAsset[assetId] ?? []).slice(0, ASSET_NEWS_ARTICLES_PER_ASSET),
      }))
      .filter((group) => group.articles.length > 0);
  }, [articlesByAsset, holdingsUsdByAsset]);

  useEffect(() => {
    setVisibleAssetCount(ASSET_NEWS_INITIAL_ASSETS);
  }, [assetGroups.length]);

  const contentReady = articlesByAsset !== null && assetGroups.length > 0;

  // After content mounts: start at max-height 0, then measure and height-down (summary pattern).
  useLayoutEffect(() => {
    if (!contentReady) return;

    setPanelOpen(true);
    setPanelHeight(0);

    let cancelled = false;
    let raf2 = 0;
    const raf1 = globalThis.requestAnimationFrame(() => {
      raf2 = globalThis.requestAnimationFrame(() => {
        if (cancelled) return;
        setPanelHeight(contentRef.current?.scrollHeight ?? 0);
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
    if (!panelOpen || panelHeight <= 0) return;
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const measure = () => {
      raf = globalThis.requestAnimationFrame(() => {
        const next = node.scrollHeight;
        setPanelHeight((prev) => (prev === next ? prev : next));
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) globalThis.cancelAnimationFrame(raf);
    };
  }, [panelOpen, panelHeight > 0]);

  if (loadError) {
    return <p className="myportfolio-leaderboard-empty">Unable to load updates. Try again later.</p>;
  }
  if (articlesByAsset && assetGroups.length === 0) {
    return <p className="myportfolio-leaderboard-empty">No updates yet.</p>;
  }

  const canPaginate = assetGroups.length > ASSET_NEWS_INITIAL_ASSETS;
  const visibleGroups = canPaginate ? assetGroups.slice(0, visibleAssetCount) : assetGroups;
  const hasMore = visibleAssetCount < assetGroups.length;

  return (
    <div
      style={{
        overflow: 'hidden',
        maxHeight: panelOpen ? `${panelHeight}px` : '0px',
        transition: `max-height ${NEWS_HEIGHT_EXPAND_MS}ms ease`,
      }}
    >
      <div ref={contentRef}>
        {visibleGroups.map((group) => (
          <div key={group.assetId} className="myportfolio-news-group">
            <div className="myportfolio-news-group-badge">
              <MyInvAssetBadgeGrid assets={[group.assetId]} linkKeyPrefix={`news-${group.assetId}`} />
            </div>
            <div className="myportfolio-news-nested myinv-accent-border">
              <div className="myportfolio-news-list">
                {group.articles.map((article) => (
                  <a
                    key={`${group.assetId}-${article.url}-${article.headline}`}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`myinv-asset-home-card home-asset-${group.assetId} myportfolio-news-card`}
                  >
                    <span className="myportfolio-news-headline">{article.headline}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
        {canPaginate ? (
          <button
            type="button"
            className="asset-range-button myinv-range-button about-cta-button myportfolio-leaderboard-show-more"
            onClick={() => {
              if (hasMore) {
                setVisibleAssetCount((count) =>
                  Math.min(count + ASSET_NEWS_LOAD_MORE_ASSETS, assetGroups.length)
                );
              } else {
                setVisibleAssetCount(ASSET_NEWS_INITIAL_ASSETS);
              }
            }}
          >
            {hasMore ? 'show more' : 'show less'}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default MyAssetsUpdates;
