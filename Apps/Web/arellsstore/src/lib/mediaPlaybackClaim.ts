/** One media source at a time (trailers, Updates videos, theme songs). */

export const MEDIA_PLAYBACK_CLAIM_EVENT = 'arells:guest-trailer-play';

export function claimMediaPlayback(token: object) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MEDIA_PLAYBACK_CLAIM_EVENT, { detail: token }));
}
