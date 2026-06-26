/** Shared SEO assets (OG image paths, per-asset description template). */

export const HOME_OG_BANNER = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export function buildAssetMetaDescription(displayName: string): string {
  return `${displayName} never loses value with Arells. Sign in to get involved in Arells' mission to ensure ${displayName} never loses value. Powered by Vavity.`;
}
