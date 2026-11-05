import type React from 'react';
import { CRYPTO_ASSETS } from '../assets/cryptoAssetRegistry';
import { STOCK_ASSETS } from '../assets/stockAssetRegistry';

const THEME_VARS = [
  '--asset-line-color',
  '--asset-hover-dot-color',
  '--asset-range-button-label-color',
  '--asset-slogan-color',
  '--myinv-accent-color',
] as const;

type ThemeVars = Partial<Record<(typeof THEME_VARS)[number], string>>;

/**
 * Fallback when the asset page isn’t mounted (portal / other browser resume).
 * Matches `.asset-page--*` hover/line accents used by the creating modal.
 */
const STATIC_ASSET_THEMES: Record<string, ThemeVars> = {
  bitcoin: {
    '--asset-slogan-color': 'rgb(172, 97, 0)',
    '--asset-line-color': 'rgb(209, 142, 55)',
    '--asset-hover-dot-color': 'rgba(248, 141, 0, 1)',
    '--asset-range-button-label-color': 'rgb(209, 142, 55)',
    '--myinv-accent-color': 'rgba(248, 141, 0, 1)',
  },
  ethereum: {
    '--asset-slogan-color': 'rgb(82, 87, 131)',
    '--asset-line-color': 'rgb(107, 114, 168)',
    '--asset-hover-dot-color': 'rgba(107, 114, 168, 1)',
    '--asset-range-button-label-color': 'rgb(107, 114, 168)',
    '--myinv-accent-color': 'rgba(107, 114, 168, 1)',
  },
  bnb: {
    '--asset-slogan-color': 'rgb(130, 92, 18)',
    '--asset-line-color': 'rgb(243, 186, 47)',
    '--asset-hover-dot-color': 'rgba(243, 186, 47, 1)',
    '--asset-range-button-label-color': 'rgb(243, 186, 47)',
    '--myinv-accent-color': 'rgba(243, 186, 47, 1)',
  },
  solana: {
    '--asset-slogan-color': 'rgb(0, 120, 100)',
    '--asset-line-color': 'rgb(0, 173, 144)',
    '--asset-hover-dot-color': 'rgba(0, 173, 144, 1)',
    '--asset-range-button-label-color': 'rgb(0, 173, 144)',
    '--myinv-accent-color': 'rgba(0, 173, 144, 1)',
  },
  xrp: {
    '--asset-slogan-color': 'rgb(20, 28, 40)',
    '--asset-line-color': 'rgb(30, 41, 59)',
    '--asset-hover-dot-color': 'rgba(30, 41, 59, 1)',
    '--asset-range-button-label-color': 'rgb(30, 41, 59)',
    '--myinv-accent-color': 'rgba(30, 41, 59, 1)',
  },
  tron: {
    '--asset-slogan-color': 'rgb(180, 0, 14)',
    '--asset-line-color': 'rgb(255, 0, 19)',
    '--asset-hover-dot-color': 'rgba(255, 0, 19, 1)',
    '--asset-range-button-label-color': 'rgb(255, 0, 19)',
    '--myinv-accent-color': 'rgba(255, 0, 19, 1)',
  },
  doge: {
    '--asset-slogan-color': 'rgb(150, 120, 30)',
    '--asset-line-color': 'rgb(194, 166, 51)',
    '--asset-hover-dot-color': 'rgba(194, 166, 51, 1)',
    '--asset-range-button-label-color': 'rgb(194, 166, 51)',
    '--myinv-accent-color': 'rgba(194, 166, 51, 1)',
  },
  cardano: {
    '--asset-slogan-color': 'rgb(0, 35, 120)',
    '--asset-line-color': 'rgb(0, 51, 173)',
    '--asset-hover-dot-color': 'rgba(0, 51, 173, 1)',
    '--asset-range-button-label-color': 'rgb(0, 51, 173)',
    '--myinv-accent-color': 'rgba(0, 51, 173, 1)',
  },
  chainlink: {
    '--asset-slogan-color': 'rgb(40, 66, 158)',
    '--asset-line-color': 'rgb(55, 91, 210)',
    '--asset-hover-dot-color': 'rgba(55, 91, 210, 1)',
    '--asset-range-button-label-color': 'rgb(55, 91, 210)',
    '--myinv-accent-color': 'rgba(55, 91, 210, 1)',
  },
  stellar: {
    '--asset-slogan-color': 'rgb(0, 0, 0)',
    '--asset-line-color': 'rgb(0, 0, 0)',
    '--asset-hover-dot-color': 'rgba(0, 0, 0, 1)',
    '--asset-range-button-label-color': 'rgb(0, 0, 0)',
    '--myinv-accent-color': 'rgba(0, 0, 0, 1)',
  },
  bch: {
    '--asset-slogan-color': 'rgb(8, 140, 100)',
    '--asset-line-color': 'rgb(10, 193, 142)',
    '--asset-hover-dot-color': 'rgba(10, 193, 142, 1)',
    '--asset-range-button-label-color': 'rgb(10, 193, 142)',
    '--myinv-accent-color': 'rgba(10, 193, 142, 1)',
  },
  microsoft: {
    '--asset-slogan-color': 'rgb(0, 90, 158)',
    '--asset-line-color': 'rgb(0, 120, 212)',
    '--asset-hover-dot-color': 'rgba(0, 120, 212, 1)',
    '--asset-range-button-label-color': 'rgb(0, 120, 212)',
    '--myinv-accent-color': 'rgba(0, 120, 212, 1)',
  },
};

function cssModifierForAsset(assetId: string): string {
  const id = assetId.trim().toLowerCase();
  const crypto = CRYPTO_ASSETS.find((a) => a.id === id);
  if (crypto) return crypto.cssModifier;
  const stock = STOCK_ASSETS.find((a) => a.id === id);
  if (stock) return stock.cssModifier;
  return id || 'bitcoin';
}

function themeStyleFromElement(el: Element | null): React.CSSProperties {
  if (!el || typeof window === 'undefined') return {};
  const computed = window.getComputedStyle(el);
  const style: Record<string, string> = {};
  for (const name of THEME_VARS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) style[name] = value;
  }
  return style as React.CSSProperties;
}

function staticThemeForAsset(assetId: string): React.CSSProperties {
  const id = assetId.trim().toLowerCase() || 'bitcoin';
  const theme = STATIC_ASSET_THEMES[id] || STATIC_ASSET_THEMES.bitcoin;
  return { ...(theme as React.CSSProperties) };
}

/**
 * CSS vars for the portaled create modal. Prefer live `.asset-page--*` when mounted,
 * else static map so remote-resume / off-asset pages still match the asset (not pink).
 */
export function overlayStyleForAsset(
  assetId: string,
  preferred?: React.CSSProperties | null
): React.CSSProperties {
  const preferredEntries =
    preferred && typeof preferred === 'object'
      ? Object.fromEntries(
          Object.entries(preferred).filter(([, v]) => typeof v === 'string' && v.trim())
        )
      : {};

  let fromDom: React.CSSProperties = {};
  if (typeof document !== 'undefined') {
    const mod = cssModifierForAsset(assetId);
    fromDom = themeStyleFromElement(document.querySelector(`.asset-page--${mod}`));
  }

  return {
    ...staticThemeForAsset(assetId),
    ...fromDom,
    ...preferredEntries,
  };
}
