'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';

type Props = {
  enabled: boolean;
  asset: 'bitcoin' | 'ethereum';
  href?: string;
  label?: string;
};

export default function PortfolioSlideUpCTA({
  enabled,
  asset,
  href = '/my-investments',
  label = 'View My Portfolio',
}: Props) {
  const [visible, setVisible] = useState(false);
  const [debugForceEnabled, setDebugForceEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastYRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const suppressUntilRef = useRef<number>(0);
  const [layout, setLayout] = useState<{
    left: number;
    width: number;
    buttonWidth: number;
    lineLeftInsetPx: number;
    lineRightInsetPx: number;
    lineColor: string;
    lineWidthPx: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fallback = document.scrollingElement?.scrollTop ?? window.scrollY ?? 0;
    lastYRef.current = fallback;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const paramForce = params.get('portfolioCta') === '1';
      const host = (window.location.hostname || '').toLowerCase();
      const localhostForce = host === 'localhost' || host === '127.0.0.1';
      setDebugForceEnabled(paramForce || localhostForce);
    } catch {
      setDebugForceEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!enabled && !debugForceEnabled) {
      setVisible(false);
      return;
    }

    // Use the page scroll position directly; this is the most reliable signal for
    // "scrolling up/down" on these asset pages and avoids `e.target` variability.
    const readPageScrollY = () => document.scrollingElement?.scrollTop ?? window.scrollY ?? 0;
    const threshold = 1; // ignore tiny jitter

    const onSuppress = (e: any) => {
      const msRaw = e?.detail?.ms;
      const ms = typeof msRaw === 'number' && Number.isFinite(msRaw) ? msRaw : 2200;
      suppressUntilRef.current = Date.now() + ms;
      setVisible(false);
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const y = readPageScrollY();
        const delta = y - lastYRef.current;

        if (y <= 0) {
          setVisible(false);
          lastYRef.current = y;
          return;
        }

        if (Math.abs(delta) < threshold) {
          lastYRef.current = y;
          return;
        }

        // Don't show the CTA while the page is programmatically scrolling due to investment buttons.
        if (Date.now() < suppressUntilRef.current) {
          if (delta < 0) setVisible(false);
          lastYRef.current = y;
          return;
        }

        if (delta < 0) {
          setVisible(false);
        } else {
          setVisible(true);
        }

        lastYRef.current = y;
      });
    };

    // Capture scrolls from any nested scroll container (not just window scrolling).
    window.addEventListener('arells:portfolioCtaSuppress', onSuppress as any);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('arells:portfolioCtaSuppress', onSuppress as any);
      window.removeEventListener('scroll', onScroll, true);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, debugForceEnabled]);

  const show = (enabled || debugForceEnabled) && visible;

  const rootClassName = useMemo(
    () => `asset-portfolio-slideup asset-portfolio-slideup--${asset}${show ? ' is-visible' : ''}`,
    [asset, show]
  );

  // Match the footprint of:
  // - the MAIN top wrapper (header panel) (for the slide-up section width)
  // - the Add Investments button itself (for the slide-up button width)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mounted) return;

    const measure = () => {
      const headerPanel = document.querySelector<HTMLElement>('.asset-page-content > .asset-header-panel');
      const headerRect = headerPanel?.getBoundingClientRect() ?? null;

      const addInvestmentsBtn = document.querySelector<HTMLElement>('.asset-page-content .asset-action-button--add-investments');
      const signInBtn = document.querySelector<HTMLElement>('.asset-page-content .asset-action-button--save-signin');
      const btnRect = addInvestmentsBtn?.getBoundingClientRect() ?? signInBtn?.getBoundingClientRect() ?? null;

      // Wrapper that holds "Add Investments" + "Sign In to Save Investments"
      const investmentsPanel = document.querySelector<HTMLElement>('.asset-page-content .asset-portfolio-center');
      const investmentsRect = investmentsPanel?.getBoundingClientRect() ?? null;

      const borderSource = investmentsPanel ?? headerPanel ?? null;
      const borderStyle = borderSource ? window.getComputedStyle(borderSource) : null;
      const lineColor =
        borderStyle?.borderLeftColor && borderStyle.borderLeftColor !== 'transparent'
          ? borderStyle.borderLeftColor
          : borderStyle?.borderColor ?? 'rgba(0, 0, 0, 0.2)';
      const lineWidthPxRaw = borderStyle?.borderLeftWidth ?? borderStyle?.borderWidth ?? '1px';
      const lineWidthPx = Number.parseFloat(lineWidthPxRaw) || 1;

      const lineLeftInsetPx =
        headerRect && investmentsRect ? Math.max(0, investmentsRect.left - headerRect.left) : 0;
      const lineRightInsetPx =
        headerRect && investmentsRect ? Math.max(0, headerRect.right - investmentsRect.right) : 0;

      if (headerRect) {
        setLayout({
          left: headerRect.left + headerRect.width / 2,
          width: headerRect.width,
          buttonWidth: btnRect?.width ?? Math.max(0, headerRect.width * 0.97),
          lineLeftInsetPx,
          lineRightInsetPx,
          lineColor,
          lineWidthPx,
        });
        return;
      }

      // Final fallback: use the button (or its parent) if header panel isn't found.
      if (addInvestmentsBtn) {
        const parent = addInvestmentsBtn.parentElement;
        const r = (parent ?? addInvestmentsBtn).getBoundingClientRect();
        setLayout({
          left: r.left + r.width / 2,
          width: r.width,
          buttonWidth: addInvestmentsBtn.getBoundingClientRect().width,
          lineLeftInsetPx: 0,
          lineRightInsetPx: 0,
          lineColor,
          lineWidthPx,
        });
        return;
      }

      setLayout(null);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mounted]);

  const node = (
    <div
      className={rootClassName}
      aria-hidden={!show}
      style={
        layout
          ? {
              left: layout.left,
              width: layout.width,
            }
          : undefined
      }
    >
      <div
        className={`asset-portfolio-summary-box asset-portfolio-summary-box--${asset} asset-portfolio-summary-box--slideup`}
        style={
          layout
            ? ({
                ['--portfolio-slideup-line-left-inset' as any]: `${layout.lineLeftInsetPx}px`,
                ['--portfolio-slideup-line-right-inset' as any]: `${layout.lineRightInsetPx}px`,
                ['--portfolio-slideup-line-color' as any]: layout.lineColor,
                ['--portfolio-slideup-line-width' as any]: `${layout.lineWidthPx}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <Link
          href={href}
          className={`asset-action-button asset-action-button--${asset} asset-action-button--add-investments asset-portfolio-slideup-button`}
          style={layout?.buttonWidth ? { width: `${layout.buttonWidth}px` } : undefined}
        >
          {label}
        </Link>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}

