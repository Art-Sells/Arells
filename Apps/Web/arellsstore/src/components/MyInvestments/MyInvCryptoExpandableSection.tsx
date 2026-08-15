'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import MyInvAssetBadgeGrid from './MyInvAssetBadgeGrid';

type MyInvCryptoExpandableSectionProps = {
  assets: string[];
  linkKeyPrefix: string;
};

const MyInvCryptoExpandableSection: React.FC<MyInvCryptoExpandableSectionProps> = ({
  assets,
  linkKeyPrefix,
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
  }, [assets]);

  return (
    <div
      className="myinv-asset-hub-crypto-collapsible is-expanded"
      style={
        contentHeight != null
          ? { maxHeight: `${contentHeight}px` }
          : undefined
      }
    >
      <div ref={contentRef} className="myinv-asset-hub-crypto-collapsible-inner">
        <MyInvAssetBadgeGrid assets={assets} linkKeyPrefix={linkKeyPrefix} />
      </div>
    </div>
  );
};

export default MyInvCryptoExpandableSection;
