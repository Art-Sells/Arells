'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import MyInvAssetBadgeGrid from './MyInvAssetBadgeGrid';

type MyInvStocksActionProps = {
  assets: string[];
  linkKeyPrefix: string;
  stocksOpen: boolean;
  onStocksOpen: () => void;
};

/** Mirrors MyInvCryptoExpandableSection structure so paddings match. */
const MyInvStocksAction: React.FC<MyInvStocksActionProps> = ({
  assets,
  linkKeyPrefix,
  stocksOpen,
  onStocksOpen,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = Math.max(0, node.scrollHeight);
        setContentHeight((prev) => (prev === next ? prev : next));
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);

    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [stocksOpen, assets]);

  return (
    <div
      className={`myinv-asset-hub-crypto-collapsible${stocksOpen ? ' is-expanded' : ''}`}
      style={
        contentHeight != null
          ? { maxHeight: `${contentHeight}px` }
          : undefined
      }
    >
      <div ref={contentRef} className="myinv-asset-hub-crypto-collapsible-inner">
        {stocksOpen ? (
          <MyInvAssetBadgeGrid assets={assets} linkKeyPrefix={linkKeyPrefix} />
        ) : (
          <div className="myinv-panel myinv-panel--shell myinv-asset-hub-crypto-shell">
            <div className="home-assets-category-button-wrap myinv-asset-hub-stocks-action">
              <button
                type="button"
                className="auth-submit asset-range-button myinv-range-button myinv-hub-action-button home-assets-show-more-button"
                onClick={onStocksOpen}
              >
                company stocks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyInvStocksAction;
