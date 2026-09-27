'use client';

import { useEffect, useState } from 'react';

/** `?guestPreview=1` forces the signed-out (guest) view, even while signed in. */
export function useGuestPreview() {
  const [guestPreview, setGuestPreview] = useState(false);

  useEffect(() => {
    try {
      const value = (new URLSearchParams(window.location.search).get('guestPreview') || '').toLowerCase();
      setGuestPreview(value === '1' || value === 'true' || value === 'yes' || value === 'on');
    } catch {
      setGuestPreview(false);
    }
  }, []);

  return guestPreview;
}
