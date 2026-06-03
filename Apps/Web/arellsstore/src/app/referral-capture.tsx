'use client';

import { Suspense } from 'react';
import ReferralCapture from '../components/Referral/ReferralCapture';

export default function ReferralCaptureRoot() {
  return (
    <Suspense fallback={null}>
      <ReferralCapture />
    </Suspense>
  );
}
