/** Normalize pathname from the client (e.g. Next usePathname) for stable S3 keys. */
export function normalizeAnalyticsPath(path: string | undefined): string | null {
  if (path == null || typeof path !== 'string') return null;
  let p = path.trim().slice(0, 256);
  if (!p) return '/';
  if (!p.startsWith('/')) p = `/${p}`;
  if (p !== '/' && /\/+$/.test(p)) p = p.replace(/\/+$/, '');
  return p || '/';
}
