import type { IncomingHttpHeaders } from 'http';

/**
 * Substrings for common crawlers, SEO tools, preview bots, and AI fetchers.
 * Case-insensitive; tuned to avoid normal browser UAs (e.g. no bare "bot" token).
 */
const CRAWLER_SUBSTRINGS = [
  'googlebot',
  'google-inspectiontool',
  'adsbot-google',
  'mediapartners-google',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'yandex.com/bots',
  'sogou web',
  'exabot',
  'facebot',
  'facebookexternalhit',
  'linkedinbot',
  'twitterbot',
  'pinterest',
  'redditbot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'bytespider',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'claude-web',
  'anthropic-ai',
  'amazonbot',
  'applebot',
  'ia_archiver',
  'ccbot',
  'dataforseobot',
  'vercelbot',
  'lighthouse',
  'prerender',
  'headlesschrome',
];

export function userAgentFromHeaders(headers: IncomingHttpHeaders): string {
  const raw = headers['user-agent'];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0] ?? '';
  return '';
}

/** True when the UA matches known crawlers / automation (e.g. Googlebot). */
export function isLikelyAutomatedClient(userAgent: string): boolean {
  const ua = userAgent.trim();
  if (!ua) return false;
  const u = ua.toLowerCase();
  for (const token of CRAWLER_SUBSTRINGS) {
    if (u.includes(token)) return true;
  }
  return false;
}
