'use client';

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
}: AlienRaceUpdatesGridProps) {
  const [visibleCount, setVisibleCount] = useState(ALIEN_RACE_UPDATES_PAGE_SIZE);
  const total = alienRaceThumbCount(days);
  const visibleDays = useMemo(() => visibleAlienRaceDays(days, visibleCount), [days, visibleCount]);
  const canShowMore = visibleCount < total;
  const playerTheme = theme === 'bitcoin' ? 'bitcoin' : 'home';

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
        <div className="home-assets-show-more-wrap alien-race-updates-more">
          <button
            type="button"
            className={
              showMoreClassName ||
              'auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button'
            }
            onClick={() => setVisibleCount((n) => n + ALIEN_RACE_UPDATES_PAGE_SIZE)}
          >
            show more
          </button>
        </div>
      ) : null}
    </div>
  );
}
