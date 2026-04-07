'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../../app/css/Home.css';
import '../../app/css/HomeLoaderOverrides.css';

const AUTH_TITLE_CROSSFADE_MS = 480;

type AuthPageShellProps = {
  children: React.ReactNode;
  title: string;
  belowCard?: React.ReactNode;
  /** Wider card + title bar for dashboards (e.g. growth metrics tables). */
  wide?: boolean;
  /** Fade between title strings instead of swapping instantly (e.g. verify flow). */
  crossfadeTitle?: boolean;
};

const AuthPageShell: React.FC<AuthPageShellProps> = ({
  children,
  title,
  belowCard,
  wide,
  crossfadeTitle = false,
}) => {
  const [slideIn, setSlideIn] = useState(false);
  const [outgoingTitle, setOutgoingTitle] = useState<string | null>(null);
  const prevTitleRef = useRef(title);

  useLayoutEffect(() => {
    setSlideIn(true);
  }, []);

  useEffect(() => {
    if (!crossfadeTitle) return;
    if (title === prevTitleRef.current) return;
    const from = prevTitleRef.current;
    prevTitleRef.current = title;
    setOutgoingTitle(from === '' ? null : from);
    const t = window.setTimeout(() => setOutgoingTitle(null), AUTH_TITLE_CROSSFADE_MS);
    return () => window.clearTimeout(t);
  }, [title, crossfadeTitle]);

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
    <div className={`auth-page myinv-page myinv-page--accent${wide ? ' auth-page--wide' : ''}`}>
      <div className={`auth-page-stack${slideIn ? ' page-slide-in' : ''}`}>
        {crossfadeTitle ? (
          <div className="auth-title-bar auth-title-bar--crossfade">
            {outgoingTitle ? (
              <span className="auth-title-layer auth-title-layer--out" aria-hidden="true">
                {outgoingTitle}
              </span>
            ) : null}
            <span
              key={title || '__empty__'}
              className={`auth-title-layer${
                title === ''
                  ? ' auth-title-layer--placeholder'
                  : outgoingTitle
                    ? ' auth-title-layer--in'
                    : ' auth-title-layer--in-solo'
              }`}
            >
              {title ? title : '\u00a0'}
            </span>
          </div>
        ) : (
          <div className="auth-title-bar">{title}</div>
        )}
        <div className="auth-card-wrap shadow-border-wrap">
          <span className="shadow-border" aria-hidden="true" />
          <div className="auth-card-inner about-card auth-about-card">
            <div className="auth-card-content">{children}</div>
          </div>
        </div>
        {belowCard && <div className="auth-below-card-outer">{belowCard}</div>}
      </div>
    </div>
  );
};

export default AuthPageShell;
