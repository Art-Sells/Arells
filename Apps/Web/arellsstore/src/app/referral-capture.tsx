'use client';

import { useEffect } from 'react';
import { captureReferralFromSearchParams } from '../lib/auth/referralClient';

export default function ReferralCaptureRoot() {
  useEffect(() => {
    captureReferralFromSearchParams(window.location.search);
  }, []);
  return null;
}
