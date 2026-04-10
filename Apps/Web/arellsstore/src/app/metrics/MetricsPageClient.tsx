'use client';

import Link from 'next/link';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import '../../app/css/Home.css';
import '../../app/css/HomeLoaderOverrides.css';
import GrowthMetricsPanel from '../../components/Metrics/GrowthMetricsPanel';
import MetricsPageActivityPanel from '../../components/Metrics/MetricsPageActivityPanel';
import MetricsPageMountRecorder from '../../components/Metrics/MetricsPageMountRecorder';

export default function MetricsPageClient() {
  const [slideIn, setSlideIn] = useState(false);

  useLayoutEffect(() => {
    setSlideIn(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  return (
    <div className="growth-metrics-page">
      <div className={`growth-metrics-page__stack${slideIn ? ' growth-metrics-page__stack--in' : ''}`}>
        <div className="growth-metrics-title-bar">
          <div className="growth-metrics-title-cluster">
            <img
              src="/images/Arells-Logo-Ebony.png"
              alt=""
              width={50}
              height={16}
              className="growth-metrics-title-wordmark"
            />
            <div className="growth-metrics-title-row">
              <span className="growth-metrics-title-word growth-metrics-title-word--growth">Growth</span>
              <Link href="/" className="growth-metrics-home-button" aria-label="Home">
                <span className="growth-metrics-home-button-icon" aria-hidden="true" />
              </Link>
              <span className="growth-metrics-title-word growth-metrics-title-word--metrics">Metrics</span>
            </div>
          </div>
        </div>
        <div className="growth-metrics-card-wrap">
          <span className="growth-metrics-card-outline" aria-hidden="true" />
          <div className="growth-metrics-card-inner">
            <div className="growth-metrics-card-content">
              <MetricsPageMountRecorder />
              <div className="growth-metrics-panels">
                <GrowthMetricsPanel />
                <MetricsPageActivityPanel />
              </div>
            </div>
          </div>
        </div>
        <div className="growth-metrics-below">
          <div
            className={`growth-metrics-about-row${slideIn ? ' growth-metrics-about-row--in' : ''}`}
          >
            <Link className="growth-metrics-about-button" href="/about">
              <span className="growth-metrics-about-button-bg" aria-hidden="true" />
              <span className="growth-metrics-about-button-text">about</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
