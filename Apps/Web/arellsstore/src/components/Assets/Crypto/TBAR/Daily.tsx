'use client';

import React from 'react';
import TBARLoadReveal from './LoadReveal';
import TBARGrid from './Grid';
import { useTBAR } from './useTBAR';
import { TBAR_PAGE_SIZE, tbarThumbCount } from '../../../../lib/assets/crypto/TBAR/media';

type TBARDailyProps = {
  variant: 'myinv' | 'bitcoin';
  mountExpand?: boolean;
};

export default function TBARDaily({ variant, mountExpand = true }: TBARDailyProps) {
  const { days, ready } = useTBAR();
  const hasContent = tbarThumbCount(days) > 0;
  const open = Boolean(mountExpand && ready && hasContent);
  const theme = variant;
  const body = (
    <TBARLoadReveal ready={ready} hasContent={hasContent} theme={theme}>
      <TBARGrid
        days={days}
        theme={theme}
        imageHref="/bitcoin/news"
        usePreviewThumbs
        seekWidthPx={variant === 'bitcoin' ? 100 : undefined}
        viewMoreHref="/bitcoin/news"
        pageSize={TBAR_PAGE_SIZE}
      />
    </TBARLoadReveal>
  );

  if (variant === 'bitcoin') {
    if (ready && !hasContent) return null;
    return (
      <div
        className={`asset-bitcoin-season-teaser-updates${
          open ? ' is-open' : ''
        }${ready && !hasContent ? ' is-collapsing' : ''}`}
      >
        <div className="asset-bitcoin-season-teaser-updates-height">
          <div className="asset-bitcoin-season-teaser-updates-inner">
            <h3 className="asset-bitcoin-season-teaser-season-title">Weekly News</h3>
            {body}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`myinv-panel-group myinv-panel-group--bordered myinv-asset-hub-group myinv-daily-updates-group${
        open ? ' is-open' : ''
      }${ready && !hasContent ? ' is-collapsing' : ''}`}
    >
      <div className="myinv-daily-updates-height">
      <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Weekly News</div>
      <div className="myinv-panel-section myinv-daily-updates-frame myinv-asset-hub-outer">
        <div className="myinv-panel myinv-panel--shell myinv-asset-hub-outer-shell">{body}</div>
      </div>
      </div>
    </div>
  );
}
