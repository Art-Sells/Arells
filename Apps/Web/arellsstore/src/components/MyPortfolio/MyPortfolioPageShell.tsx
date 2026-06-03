'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SiteSocialFooter from '../SiteSocialFooter';

type MyPortfolioPageShellProps = {
  pageTitle: string;
  children: React.ReactNode;
  isGuest: boolean;
  authSessionLoading: boolean;
};

const MyPortfolioPageShell: React.FC<MyPortfolioPageShellProps> = ({
  pageTitle,
  children,
  isGuest,
  authSessionLoading,
}) => {
  const [open, setOpen] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [shellMaxHeight, setShellMaxHeight] = useState(0);

  useEffect(() => {
    setOpen(false);
    let raf = 0;
    let raf2 = 0;
    raf = window.requestAnimationFrame(() => {
      const h = wrapperRef.current?.scrollHeight ?? 0;
      setShellMaxHeight(Math.max(0, h + 24));
      raf2 = window.requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, []);

  useLayoutEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        setShellMaxHeight(Math.max(0, node.scrollHeight + 24));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [children, isGuest, authSessionLoading]);

  useEffect(() => {
    if (!open) return;
    setSlideIn(true);
  }, [open]);

  useEffect(() => {
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    const bg = 'var(--page-accent-tint)';
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, []);

  return (
    <div className={`myinv-page myinv-page--accent myinv-page--portfolio${isGuest ? ' myinv-page--guest' : ''}`}>
      <div className={`myinv-header-inner myinv-header-inner--liquid-forever${slideIn ? ' page-slide-in' : ''} is-liquid`}>
        <div className="myinv-title">{pageTitle}</div>
      </div>
      <div className="myinv-shell shadow-border-wrap">
        <span className="shadow-border" aria-hidden="true" />
        <div
          className={`asset-slide-panel myinv-slide${open ? ' is-open' : ''}`}
          style={{ maxHeight: open ? `${shellMaxHeight}px` : '0px', transition: 'max-height 2s ease' }}
        >
          <div ref={wrapperRef} className="myinv-wrapper">
            {!isGuest && !authSessionLoading ? (
              children
            ) : !authSessionLoading && isGuest ? (
              <div className={`myinv-panel${slideIn ? ' page-slide-in' : ''}`}>
                <div className="myinv-cta-row">
                  <Link href="/signin" className="myinv-cta-button">
                    <span className="myinv-cta-button-bg" aria-hidden="true" />
                    <span className="myinv-cta-button-text">Sign In</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="myinv-about-wrap">
        <Link className="myinv-about-button" href="/about">
          <span className="myinv-about-button-bg" aria-hidden="true" />
          <span className="myinv-about-button-text">about</span>
        </Link>
      </div>
      <SiteSocialFooter variant="accent" />
    </div>
  );
};

export default MyPortfolioPageShell;
