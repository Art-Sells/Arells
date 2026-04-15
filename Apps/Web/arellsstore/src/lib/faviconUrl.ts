/** Bump when favicon assets change so browsers/CDNs treat URLs as new resources. */
const FAVICON_CACHE_BUST = 'v=2';

/** Appends cache-bust query to static icon paths for `<link rel="icon">` metadata. */
export function faviconUrl(path: string): string {
  if (path.includes('?')) return path;
  return `${path}?${FAVICON_CACHE_BUST}`;
}
