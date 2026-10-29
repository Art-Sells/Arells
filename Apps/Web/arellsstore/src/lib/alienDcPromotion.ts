/** DC (dynamic characters) promo — one-shot until OK, reopen via PHOTO. */

export const DC_PROMOTION_VIDEO_URL =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/DCPromotion.mp4';

const STORAGE_KEY = 'arells:dc-promotion-ok';

export function hasDismissedDcPromotion(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissDcPromotion(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}
