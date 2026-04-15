import type { Metadata } from 'next';

/**
 * Default tab / PWA icons. ICO + sized PNG + apple-touch gives Android Chrome and Safari
 * multiple same-origin targets (SVG-only metadata is weak on mobile).
 */
export const defaultSiteIcons: Metadata['icons'] = {
  icon: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/ArellsIcoIcon.png', type: 'image/png', sizes: '192x192' },
    { url: '/ArellsIcoIcon.png', type: 'image/png', sizes: '512x512' },
  ],
  apple: [{ url: '/ArellsIcoIcon.png', sizes: '180x180', type: 'image/png' }],
  shortcut: '/favicon.ico',
};
