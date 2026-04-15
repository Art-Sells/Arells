/**
 * Origin for Next `metadataBase` (absolute favicon / canonical / OG URLs). No trailing slash.
 *
 * On Amplify preview/prod, this MUST match the hostname users open (set NEXT_PUBLIC_IMAGE_URL at
 * build). If it stays on arells.com while users visit *.amplifyapp.com,
 * `<link rel="icon" href="https://arells.com/...">` can break favicon association in Chrome mobile.
 */
export function getSiteMetadataBase(): URL {
  const raw = (process.env.NEXT_PUBLIC_IMAGE_URL?.trim() || 'https://arells.com').replace(/\/$/, '');

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(withScheme);
  } catch {
    return new URL('https://arells.com');
  }
}
