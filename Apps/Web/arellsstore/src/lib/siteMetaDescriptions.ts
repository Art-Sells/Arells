/** Shared meta descriptions (also used in OG/Twitter on each route). */

export const HOME_OG_BANNER = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION =
  'Investments never lose value with Arells. Arells is on a mission to ensure investments never lose value. Powered by Vavity.';

export const SIGN_IN_META_DESCRIPTION =
  'Sign in to join our mission to ensure investments never lose value. Powered by Vavity.';

export const SIGN_UP_META_DESCRIPTION =
  'Sign up to join our mission to ensure investments never lose value. Powered by Vavity.';

export function buildAssetMetaDescription(displayName: string): string {
  return `${displayName} never loses value with Arells. Sign in to get involved in Arells' mission to ensure ${displayName} never loses value. Powered by Vavity.`;
}
