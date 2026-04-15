/**
 * Mobile Safari and Chrome often keep favicons in a separate, aggressive cache. The file URL can
 * 200 OK in the address bar while the tab still shows a stale or blank (globe) icon. Setting
 * NEXT_PUBLIC_ASSET_VERSION at build (e.g. to your git commit or Amplify build id) changes the
 * `<link href>` query string after each deploy so clients treat it as a new resource.
 */
export function iconAssetUrl(path: string): string {
  const v = process.env.NEXT_PUBLIC_ASSET_VERSION?.trim();
  if (!v) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}v=${encodeURIComponent(v)}`;
}
