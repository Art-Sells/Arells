import type { Metadata } from 'next';
import { iconAssetUrl } from './iconAssetUrl';

const u = iconAssetUrl;

/**
 * Default tab / PWA icons. ICO + sized PNG + apple-touch gives Android Chrome and Safari
 * multiple same-origin targets (SVG-only metadata is weak on mobile).
 */
export const defaultSiteIcons: Metadata['icons'] = {
  icon: [
    { url: u('/ArellsFavicon.ico'), sizes: 'any' },
    { url: u('/ArellsIcon.png'), type: 'image/png', sizes: '192x192' },
    { url: u('/ArellsIcon.png'), type: 'image/png', sizes: '512x512' },
  ],
  apple: [{ url: u('/ArellsIcon.png'), sizes: '180x180', type: 'image/png' }],
  shortcut: u('/ArellsFavicon.ico'),
};
