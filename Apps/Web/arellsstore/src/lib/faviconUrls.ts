/**
 * Cache-bust favicon / apple-touch-icon URLs. iOS Safari often keeps an old tab icon
 * for the same path even after “Clear Website Data”; a new query string forces a fetch.
 * Bump SITE_ICO_VERSION when you need devices to pick up icon changes again.
 */
export const SITE_ICO_VERSION = '20260415';

export const arellsIcoIconUrl = `/ArellsIcoIcon.png?v=${SITE_ICO_VERSION}`;

export const vavityFaviconUrl = `/images/vavity/favicon.png?v=${SITE_ICO_VERSION}`;
