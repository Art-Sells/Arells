'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import HomeAssetCategoryActionCrossfade from './HomeAssetCategoryActionCrossfade';

type HomeAssetCategoryCardProps = {
  enabled?: boolean;
  mountSlideClassName?: string;
  wrapperClassName?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
  /** cryptocurrencies / company stocks — separate wrap spacing from show-more assets */
  categoryButton?: boolean;
  comingSoonText?: string | null;
  children?: React.ReactNode;
  wrapperRef?: React.RefObject<HTMLDivElement | null>;
  panelTransition?: string;
};

const HomeAssetCategoryCard: React.FC<HomeAssetCategoryCardProps> = ({
  enabled = true,
  mountSlideClassName = 'page-slide-down',
  wrapperClassName = '',
  buttonLabel,
  onButtonClick,
  showButton = false,
  categoryButton = false,
  comingSoonText = null,
  children,
  wrapperRef,
  panelTransition = 'max-height 3.5s linear',
}) => {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const localWrapRef = useRef<HTMLDivElement | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMaxHeight, setPanelMaxHeight] = useState(0);

  const setWrapRef = (node: HTMLDivElement | null) => {
    localWrapRef.current = node;
    if (wrapperRef) {
      (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  useEffect(() => {
    if (!enabled) {
      setPanelOpen(false);
      setPanelMaxHeight(0);
      return;
    }
    let raf = 0;
    let raf2 = 0;
    raf = window.requestAnimationFrame(() => {
      const h = innerRef.current?.scrollHeight ?? 0;
      setPanelMaxHeight(Math.max(0, h + 24));
      raf2 = window.requestAnimationFrame(() => setPanelOpen(true));
    });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [enabled]);

  useLayoutEffect(() => {
    if (!enabled) return;
    const node = innerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const measure = () => {
      raf = window.requestAnimationFrame(() => {
        const next = Math.max(0, node.scrollHeight + 24);
        const actionOnlyCategoryCard = categoryButton && !children;
        setPanelMaxHeight((prev) => {
          if (actionOnlyCategoryCard && panelOpen) {
            return Math.max(prev, next);
          }
          return prev === next ? prev : next;
        });
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [enabled, showButton, comingSoonText, categoryButton, children, panelOpen]);

  const showCategoryAction =
    categoryButton && ((showButton && buttonLabel) || comingSoonText);

  const useComingSoonCrossfade =
    categoryButton && Boolean(buttonLabel) && Boolean(comingSoonText);

  const categoryActionWrap = showCategoryAction ? (
    useComingSoonCrossfade ? (
      <HomeAssetCategoryActionCrossfade
        buttonLabel={buttonLabel!}
        showButton={Boolean(showButton && buttonLabel)}
        comingSoonText={comingSoonText!}
        onButtonClick={onButtonClick}
      />
    ) : (
      <div className="home-assets-category-button-wrap">
        {showButton && buttonLabel ? (
          <button
            type="button"
            className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button"
            onClick={onButtonClick}
          >
            {buttonLabel}
          </button>
        ) : comingSoonText ? (
          <div className="home-asset-category-coming-soon">{comingSoonText}</div>
        ) : null}
      </div>
    )
  ) : null;

  const showMoreButton =
    !categoryButton && showButton && buttonLabel ? (
      <div className="home-assets-show-more-wrap">
        <button
          type="button"
          className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button"
          onClick={onButtonClick}
        >
          {buttonLabel}
        </button>
      </div>
    ) : null;

  return (
    <div
      ref={setWrapRef}
      className={`home-assets-wrapper home-asset-category-card shadow-border-wrap${mountSlideClassName ? ` ${mountSlideClassName}` : ''}${wrapperClassName ? ` ${wrapperClassName}` : ''}`}
    >
      <span className="shadow-border" aria-hidden="true" />
      <div
        className={`asset-slide-panel home-assets-card-slide${panelOpen ? ' is-open' : ''}`}
        style={{
          maxHeight: panelOpen ? `${panelMaxHeight}px` : '0px',
          transition: panelTransition,
        }}
      >
        <div ref={innerRef} className="home-assets-slide-inner">
          <div className="home-assets-list">
            <div className="home-assets-table-shell myinv-accent-border">
              {children}
              {categoryActionWrap}
              {showMoreButton}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAssetCategoryCard;
