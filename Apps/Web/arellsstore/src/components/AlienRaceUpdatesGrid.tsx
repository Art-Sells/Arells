'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import GuestTrailerPlayer from './GuestTrailerPlayer';
import AlienRaceUpdateImage from './AlienRaceUpdateImage';
import { BitcoinMemoriamStoryline } from './StorylineOpening';
import {
  ALIEN_RACE_UPDATES_PAGE_SIZE,
  alienRaceThumbCount,
  visibleAlienRaceDays,
  type AlienRaceDay,
} from '../lib/bitcoinAlienRaceUpdates';
import type { TrailerSources } from '../lib/guestTrailer';

type AlienRaceUpdatesGridProps = {
  days: AlienRaceDay[];
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

export default function AlienRaceUpdatesGrid({
  days,
  theme,
  imageHref,
  showMoreClassName,
  usePreviewThumbs,
  seekWidthPx,
  viewMoreHref,
  pageSize = ALIEN_RACE_UPDATES_PAGE_SIZE,
}: AlienRaceUpdatesGridProps) {
  const [visibleDayCount, setVisibleDayCount] = useState(pageSize);
  const total = alienRaceThumbCount(days);
  const daysWithMedia = useMemo(
    () => days.filter((day) => day.media.length > 0),
    [days]
  );
  const totalDays = daysWithMedia.length;
  const visibleDays = useMemo(
    () => visibleAlienRaceDays(daysWithMedia, visibleDayCount),
    [daysWithMedia, visibleDayCount]
  );
  const canShowMore = visibleDayCount < totalDays;
  const playerTheme = theme === 'bitcoin' ? 'bitcoin' : 'home';
  const moreLabel = theme === 'bitcoin' && !viewMoreHref ? 'show more' : 'View More Updates';

  if (total === 0) return null;

  return (
    <div
      className={`alien-race-updates-grid alien-race-updates-grid--${theme}${
        usePreviewThumbs ? ' alien-race-updates-grid--thumbs' : ''
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
          <div key={day.folder} className="alien-race-updates-day">
            <h3 className="alien-race-updates-date">{day.label}</h3>
            <div className="alien-race-updates-thumbs">
              {memoriamItems.map((item) => (
                <div key={item.key} className="alien-race-memoriam-section">
                  <AlienRaceUpdateImage
                    src={item.url}
                    theme={theme}
                    label={`${day.label} update`}
                  />
                  <div className="alien-race-memoriam-copy">
                    <BitcoinMemoriamStoryline />
                  </div>
                </div>
              ))}
              {rest.map((item) =>
                item.kind === 'video' ? (
                  <div key={item.key} className="alien-race-updates-thumb alien-race-updates-thumb--player">
                    <GuestTrailerPlayer
                      theme={playerTheme}
                      sources={item.sources || videoSources(item.url)}
                      poster={item.previewUrl ?? null}
                      useVideoThumbnail={!item.previewUrl}
                      compact
                      hideSeek
                    />
                  </div>
                ) : (
                  <AlienRaceUpdateImage
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
          className={`home-assets-show-more-wrap alien-race-updates-more${
            viewMoreHref ? ' alien-race-updates-more--hub-link' : ''
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
                <span className="alien-race-updates-more-label">{moreLabel}</span>
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
