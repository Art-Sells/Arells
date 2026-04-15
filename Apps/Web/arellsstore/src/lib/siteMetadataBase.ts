/** Origin for Next `metadataBase` (absolute favicons, canonical, relative OG image URLs). No trailing slash. */
export function getSiteMetadataBase(): URL {
  const raw = (process.env.NEXT_PUBLIC_IMAGE_URL || 'https://arells.com').trim().replace(/\/$/, '');
  try {
    return new URL(raw);
  } catch {
    return new URL('https://arells.com');
  }
}
