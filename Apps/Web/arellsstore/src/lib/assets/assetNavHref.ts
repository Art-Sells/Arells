import { CRYPTO_ASSETS } from './cryptoAssetRegistry';
import { STOCK_ASSETS } from './stockAssetRegistry';

/** Subpaths under an asset root that are not the main asset page. */
const ASSET_SUBROUTE_BLOCKLIST = new Set(['news', 'my-character']);

type AssetNavMatch = {
  id: string;
  cssModifier: string;
  href: string;
};

const ASSET_NAV_ENTRIES: readonly AssetNavMatch[] = [
  ...CRYPTO_ASSETS.map((a) => ({
    id: a.id,
    cssModifier: a.cssModifier,
    href: a.href,
  })),
  ...STOCK_ASSETS.map((a) => ({
    id: a.id,
    cssModifier: a.cssModifier,
    href: a.href,
  })),
].sort((a, b) => b.href.length - a.href.length);

function normalizePath(raw: string): string {
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      raw = new URL(raw).pathname;
    }
  } catch {
    /* keep raw */
  }
  const path = raw.split('?')[0].split('#')[0] || '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

/**
 * If href is a main asset page (or /asset/{shareId}), return css modifier for the loader.
 * Excludes /bitcoin/news, /bitcoin/my-character, etc.
 */
export function assetNavCssModifierFromHref(href: string | null | undefined): string | null {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return null;
  const path = normalizePath(href);

  for (const entry of ASSET_NAV_ENTRIES) {
    if (path === entry.href) return entry.cssModifier;
    if (!path.startsWith(`${entry.href}/`)) continue;
    const rest = path.slice(entry.href.length + 1);
    if (!rest || rest.includes('/')) continue;
    if (ASSET_SUBROUTE_BLOCKLIST.has(rest.toLowerCase())) continue;
    return entry.cssModifier;
  }
  return null;
}

export function isSameAssetNavTarget(currentPath: string, href: string): boolean {
  return normalizePath(currentPath) === normalizePath(href);
}
