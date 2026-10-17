'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import VideoPlayer from '../../../VideoPlayer';
import TBARImage from './Image';
import { BitcoinMemoriamStoryline } from '../../../StorylineOpening';
import {
  TBAR_PAGE_SIZE,
  tbarThumbCount,
  visibleTBARDays,
  type TBARDay,
} from '../../../../lib/assets/crypto/TBAR/media';
import type { TrailerSources } from '../../../../lib/videoPlayer';

/** Match Hide investments (asset pages). */
const TBAR_COLLAPSE_MS = 2500;

type TBARGridProps = {
  days: TBARDay[];
  theme: 'myinv' | 'bitcoin';
  imageHref?: string;
  showMoreClassName?: string;
  usePreviewThumbs?: boolean;
  seekWidthPx?: number;
  viewMoreHref?: string;
  pageSize?: number;
};

function videoSources(url: string): TrailerSources {
  return { '480': url, '720': url, '1080': url };
}

function isBitcoinMemoriamStill(name: string): boolean {
  const file = name.split('/').filter(Boolean).pop() || name;
  return /TheBitcoinMemoriam/i.test(file);
}

export default function TBARGrid({
  days,
  theme,
  imageHref,
  showMoreClassName,
  usePreviewThumbs,
  viewMoreHref,
  pageSize = TBAR_PAGE_SIZE,
}: TBARGridProps) {
  const [visibleDayCount, setVisibleDayCount] = useState(pageSize);
  /** Extra days stay mounted while this is true; max-height animates open/closed (Hide investments). */
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraHeight, setExtraHeight] = useState(0);
  const total = tbarThumbCount(days);
  const daysWithMedia = useMemo(
    () => days.filter((day) => day.media.length > 0),
    [days]
  );
  const totalDays = daysWithMedia.length;
  const visibleDays = useMemo(
    () => visibleTBARDays(daysWithMedia, visibleDayCount),
    [daysWithMedia, visibleDayCount]
  );
  const headDays = useMemo(() => visibleDays.slice(0, pageSize), [visibleDays, pageSize]);
  const extraDays = useMemo(() => visibleDays.slice(pageSize), [visibleDays, pageSize]);
  const hasExtra = extraDays.length > 0;
  const canShowMore = visibleDayCount < totalDays;
  const canHideMore = !viewMoreHref && visibleDayCount > pageSize;
  const playerTheme = theme === 'bitcoin' ? 'bitcoin' : 'home';
  const moreLabel = theme === 'bitcoin' && !viewMoreHref ? 'show more' : 'View More News';
  const hideLabel = 'hide more';
  const expandButtonClass =
    showMoreClassName ||
    (theme === 'bitcoin'
      ? 'auth-submit asset-range-button asset-range-button--bitcoin home-assets-show-more-button'
      : 'auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button');

  const extraContentRef = useRef<HTMLDivElement>(null);
  const hideCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Measure extra block the same way investments list measures scrollHeight. */
  useEffect(() => {
    if (!hasExtra) {
      setExtraHeight(0);
      return;
    }
    const node = extraContentRef.current;
    if (!node) return;
    if (typeof ResizeObserver === 'undefined') {
      setExtraHeight(node.scrollHeight);
      return;
    }
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = node.scrollHeight;
        setExtraHeight((prev) => (prev === next ? prev : next));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [hasExtra, extraDays, extraOpen]);

  useEffect(() => {
    return () => {
      if (hideCommitTimerRef.current) clearTimeout(hideCommitTimerRef.current);
    };
  }, []);

  const renderDay = (day: (typeof visibleDays)[number]) => {
    const hubMemoriam = theme === 'bitcoin' && !usePreviewThumbs;
    const memoriamItems = hubMemoriam
      ? day.media.filter((item) => item.kind === 'image' && isBitcoinMemoriamStill(item.name))
      : [];
    const rest = hubMemoriam
      ? day.media.filter((item) => !(item.kind === 'image' && isBitcoinMemoriamStill(item.name)))
      : day.media;

    return (
      <div key={day.folder} className="tbar-day">
        <h3 className="tbar-date">{day.label}</h3>
        <div className="tbar-thumbs">
          {memoriamItems.map((item) => (
            <div key={item.key} className="tbar-memoriam-section">
              <TBARImage src={item.url} theme={theme} label={`${day.label} update`} />
              <div className="tbar-memoriam-copy">
                <BitcoinMemoriamStoryline />
              </div>
            </div>
          ))}
          {rest.map((item) =>
            item.kind === 'video' ? (
              <div key={item.key} className="tbar-thumb tbar-thumb--player">
                <VideoPlayer
                  theme={playerTheme}
                  sources={item.sources || videoSources(item.url)}
                  poster={item.previewUrl ?? null}
                  compact
                  hideSeek
                />
              </div>
            ) : (
              <TBARImage
                key={item.key}
                src={usePreviewThumbs && item.previewUrl ? item.previewUrl : item.url}
                theme={theme}
                href={imageHref}
                label={`${day.label} update`}
              />
            )
          )}
        </div>
      </div>
    );
  };

  if (total === 0) return null;

  const extraMaxHeight = extraOpen ? `${extraHeight}px` : '0px';

  return (
    <div
      className={`tbar-grid tbar-grid--${theme}${
        usePreviewThumbs ? ' tbar-grid--thumbs' : ''
      }`}
    >
      {headDays.map(renderDay)}
      {hasExtra ? (
        <div
          className="tbar-grid-extra-shell"
          style={{
            maxHeight: extraMaxHeight,
            overflow: 'hidden',
            transition: `max-height ${TBAR_COLLAPSE_MS}ms ease`,
          }}
        >
          <div ref={extraContentRef} className="tbar-grid-extra">
            {extraDays.map(renderDay)}
          </div>
        </div>
      ) : null}
      {viewMoreHref && canShowMore ? (
        <div className="home-assets-show-more-wrap tbar-more tbar-more--hub-link">
          <Link
            href={viewMoreHref}
            className={
              showMoreClassName ||
              (theme === 'bitcoin'
                ? 'asset-action-button asset-action-button--save-signin asset-action-button--bitcoin'
                : 'auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button')
            }
          >
            {theme === 'bitcoin' ? (
              <span className="asset-save-signin-text">{moreLabel}</span>
            ) : (
              <span className="tbar-more-label">{moreLabel}</span>
            )}
          </Link>
        </div>
      ) : null}
      {!viewMoreHref && canShowMore ? (
        <div className="home-assets-show-more-wrap tbar-more">
          <button
            type="button"
            className={expandButtonClass}
            onClick={() => {
              if (hideCommitTimerRef.current) {
                clearTimeout(hideCommitTimerRef.current);
                hideCommitTimerRef.current = null;
              }
              // Mount extra days first (like setShowInvestmentsList), then open (height-down).
              setVisibleDayCount((n) => n + pageSize);
              window.setTimeout(() => setExtraOpen(true), 0);
            }}
          >
            {moreLabel}
          </button>
        </div>
      ) : null}
      {!viewMoreHref && canHideMore ? (
        <div className="home-assets-show-more-wrap tbar-more">
          <button
            type="button"
            className={expandButtonClass}
            onClick={() => {
              // Hide investments: close max-height to 0 first; trim content after transition.
              setExtraOpen(false);
              if (hideCommitTimerRef.current) clearTimeout(hideCommitTimerRef.current);
              hideCommitTimerRef.current = setTimeout(() => {
                setVisibleDayCount(pageSize);
                hideCommitTimerRef.current = null;
              }, TBAR_COLLAPSE_MS);
            }}
          >
            {hideLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
