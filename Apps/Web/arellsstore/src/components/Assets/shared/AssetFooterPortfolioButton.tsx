'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const PORTFOLIO_NAV_DELAY_MS = 280;

type AssetFooterPortfolioButtonProps = {
  cssModifier: string;
};

export default function AssetFooterPortfolioButton({ cssModifier }: AssetFooterPortfolioButtonProps) {
  const router = useRouter();
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) globalThis.clearTimeout(navTimerRef.current);
    };
  }, []);

  const onViewPortfolio = () => {
    if (loadingPortfolio) return;
    setLoadingPortfolio(true);
    if (navTimerRef.current) globalThis.clearTimeout(navTimerRef.current);
    navTimerRef.current = globalThis.setTimeout(() => {
      navTimerRef.current = null;
      router.push('/my-portfolio');
    }, PORTFOLIO_NAV_DELAY_MS);
  };

  return (
    <button
      type="button"
      onClick={onViewPortfolio}
      disabled={loadingPortfolio}
      aria-busy={loadingPortfolio || undefined}
      className={`asset-action-button asset-action-button--${cssModifier} asset-action-button--invest-show asset-footer-about-button asset-footer-portfolio-button`}
    >
      {loadingPortfolio ? (
        <span className="asset-footer-portfolio-button-spinner" aria-hidden="true" />
      ) : null}
      <span className="asset-footer-about-text">
        {loadingPortfolio ? 'loading portfolio' : 'view my portfolio'}
      </span>
    </button>
  );
}
