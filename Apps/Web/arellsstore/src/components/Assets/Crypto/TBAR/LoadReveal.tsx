'use client';

import React, { useEffect, useState } from 'react';

type TBARLoadRevealProps = {
  ready: boolean;
  hasContent: boolean;
  theme: 'bitcoin' | 'myinv';
  children: React.ReactNode;
};

export default function TBARLoadReveal({
  ready,
  hasContent,
  theme,
  children,
}: TBARLoadRevealProps) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready || hasContent) {
      setGone(false);
      return;
    }
    const timeout = window.setTimeout(() => setGone(true), 2000);
    return () => window.clearTimeout(timeout);
  }, [ready, hasContent]);

  if (gone) return null;

  const showContent = ready && hasContent;
  const showLoader = !ready;
  const showEmpty = ready && !hasContent;

  if (!showContent && !showLoader && !showEmpty) return null;

  return (
    <div
      className={`tbar-load-reveal tbar-load-reveal--${theme}${showContent ? ' is-open' : ''}${
        showEmpty ? ' is-empty' : ''
      }`}
    >
      {showLoader ? (
        <div className="tbar-load-reveal-loader is-visible" aria-hidden="true">
          <div className={`tbar-load-reveal-ring tbar-inflow-circle`} />
        </div>
      ) : null}
      {showContent ? <div className="tbar-load-reveal-body is-open">{children}</div> : null}
    </div>
  );
}
