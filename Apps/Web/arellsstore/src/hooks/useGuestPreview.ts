'use client';

import { useEffect, useState } from 'react';

export function guestPreviewFromSearch(value: string | null | undefined) {
  const v = (value || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** Current URL, so a redirect effect can see the flag before React state updates. */
export function guestPreviewFromLocation() {
  if (typeof window === 'undefined') return false;
  try {
    return guestPreviewFromSearch(new URLSearchParams(window.location.search).get('guestPreview'));
  } catch {
    return false;
  }
}

/** `?guestPreview=1` forces the signed-out (guest) view, even while signed in. */
export function useGuestPreview() {
  const [guestPreview, setGuestPreview] = useState(false);

  useEffect(() => {
    setGuestPreview(guestPreviewFromLocation());
  }, []);

  return guestPreview;
}
