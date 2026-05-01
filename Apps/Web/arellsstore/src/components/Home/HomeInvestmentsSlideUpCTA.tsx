'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type Props = {
  href?: string;
  label?: string;
  /** Optional line above the button (e.g. signed-out home CTA). */
  lead?: string;
};

export default function HomeInvestmentsSlideUpCTA({
  href = '/my-investments',
  label = 'View My Investments',
  lead,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState<{ left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [mounted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mounted) return;

    const measure = () => {
      const wrapper = document.querySelector<HTMLElement>('.home-assets-wrapper');
      if (wrapper) {
        const r = wrapper.getBoundingClientRect();
        setLayout({
          left: r.left + r.width / 2,
          width: r.width,
        });
        return;
      }
      const list = document.querySelector<HTMLElement>('.home-assets-list');
      if (list) {
        const r = list.getBoundingClientRect();
        setLayout({
          left: r.left + r.width / 2,
          width: r.width,
        });
        return;
      }
      setLayout(null);
    };

    measure();
    let lastWidth = window.innerWidth;
    let lastScrollX = window.scrollX;
    const onResize = () => {
      const w = window.innerWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      measure();
    };
    const onScroll = () => {
      const x = window.scrollX;
      if (x === lastScrollX) return;
      lastScrollX = x;
      measure();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, [mounted]);

  // Sticky: no scroll listener needed.

  const rootClassName = useMemo(
    () => `home-investments-slideup${visible ? ' is-visible' : ''}`,
    [visible]
  );
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cls = 'has-home-investments-cta';
    if (visible) {
      document.body.classList.add(cls);
      return () => {
        document.body.classList.remove(cls);
      };
    }
    document.body.classList.remove(cls);
  }, [visible]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (!visible) {
      document.documentElement.style.removeProperty('--home-investments-cta-offset');
      return;
    }
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const height = node.offsetHeight || 0;
      document.documentElement.style.setProperty('--home-investments-cta-offset', `${height + 12}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--home-investments-cta-offset');
    };
  }, [visible, layout]);

  const node = (
    <div
      ref={rootRef}
      className={rootClassName}
      aria-hidden={!visible}
      style={
        layout
          ? {
              left: layout.left,
              width: layout.width,
            }
          : undefined
      }
    >
      <div className="home-investments-slideup-shell shadow-border-wrap">
        <span className="shadow-border" aria-hidden="true" />
        <div className="home-investments-slideup-stack">
          {lead ? <p className="home-investments-slideup-lead">{lead}</p> : null}
          <div className="home-investments-slideup-row">
            <div className="home-investments-slideup-index-spacer" aria-hidden="true" />
            <Link href={href} className="home-investments-slideup-button">
              <span className="home-investments-slideup-button-bg" aria-hidden="true" />
              <span className="home-investments-slideup-button-text">{label}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return node;
}

