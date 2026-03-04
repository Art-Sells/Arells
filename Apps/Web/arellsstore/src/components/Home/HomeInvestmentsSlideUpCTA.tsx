'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';

type Props = {
  href?: string;
  label?: string;
};

export default function HomeInvestmentsSlideUpCTA({ href = '/my-investments', label = 'View My Investments' }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState<{ left: number; width: number; buttonHeight: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    // Sticky: always visible regardless of scroll direction.
    setVisible(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mounted) return;

    const measure = () => {
      const wrapper = document.querySelector<HTMLElement>('.home-assets-wrapper');
      const assetButton = document.querySelector<HTMLElement>('.home-asset-card');
      const assetRect = assetButton?.getBoundingClientRect() ?? null;
      if (wrapper) {
        const r = wrapper.getBoundingClientRect();
        setLayout({
          left: r.left + r.width / 2,
          width: r.width,
          buttonHeight: assetRect?.height ?? 0,
        });
        return;
      }
      const list = document.querySelector<HTMLElement>('.home-assets-list');
      if (list) {
        const r = list.getBoundingClientRect();
        setLayout({
          left: r.left + r.width / 2,
          width: r.width,
          buttonHeight: assetRect?.height ?? 0,
        });
        return;
      }
      setLayout(null);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [mounted]);

  // Sticky: no scroll listener needed.

  const rootClassName = useMemo(
    () => `home-investments-slideup${visible ? ' is-visible' : ''}`,
    [visible]
  );

  const node = (
    <div
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
      <div className="home-investments-slideup-shell">
        <div className="home-investments-slideup-row">
          <div className="home-investments-slideup-index-spacer" aria-hidden="true" />
          <Link
            href={href}
            className="home-investments-slideup-button"
            style={layout?.buttonHeight ? { height: `${layout.buttonHeight}px` } : undefined}
          >
            <span className="home-investments-slideup-button-text">{label}</span>
          </Link>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}

