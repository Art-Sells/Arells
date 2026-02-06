import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/bitcoin-dashboard/BitcoinDashboard.css';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Arells Bitcoin",
  description: "Bitcoin dashboard for Arells.",
  robots: "noimageindex",
  openGraph: {
    title: "Arells Bitcoin",
    description: "Bitcoin dashboard for Arells.",
    url: "https://arells.com/bitcoin",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "If bear markets never existed Connect your investments.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

  const BitcoinPage = () => {
  

  return (
    <>
      <div id="account-wrapper">
        <div style={{ padding: '24px', color: '#fff' }}>Bitcoin dashboard is unavailable.</div>
      </div>
    </>
  );
}

export default BitcoinPage;