'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
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

type TBARGridProps = {
  days: TBARDay[];
  theme: 'myinv' | 'bitcoin';
  imageHref?: string;
  showMoreClassName?: string;
  usePreviewThumbs?: boolean;
  seekWidthPx?: number;
  /** When set, footer is a link instead of in-place expand. */
  viewMoreHref?: string;
  /** How many date folders to show before the footer control. */
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
  seekWidthPx,
  viewMoreHref,
  pageSize = TBAR_PAGE_SIZE,
}: TBARGridProps) {
  const [visibleDayCount, setVisibleDayCount] = useState(pageSize);
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
  const canShowMore = visibleDayCount < totalDays;
  const playerTheme = theme === 'bitcoin' ? 'bitcoin' : 'home';
  const moreLabel = theme === 'bitcoin' && !viewMoreHref ? 'show more' : 'View More Updates';

  if (total === 0) return null;

  return (
    <div
      className={`tbar-grid tbar-grid--${theme}${
        usePreviewThumbs ? ' tbar-grid--thumbs' : ''
      }`}
    >
      {visibleDays.map((day) => {
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
                  <TBARImage
                    src={item.url}
                    theme={theme}
                    label={`${day.label} update`}
                  />
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
      })}
      {canShowMore ? (
        <div
          className={`home-assets-show-more-wrap tbar-more${
            viewMoreHref ? ' tbar-more--hub-link' : ''
          }`}
        >
          {viewMoreHref ? (
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
          ) : (
            <button
              type="button"
              className={
                showMoreClassName ||
                (theme === 'bitcoin'
                  ? 'auth-submit asset-range-button asset-range-button--bitcoin home-assets-show-more-button'
                  : 'auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button')
              }
              onClick={() => setVisibleDayCount((n) => n + pageSize)}
            >
              {moreLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
