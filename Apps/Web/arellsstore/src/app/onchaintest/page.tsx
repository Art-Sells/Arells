import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import OnchainTest from '../../components/OnchainKit/OnchainTest';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Onchain Test",
  description: "Bitcoin investments that never lose value.",
  robots: "noimageindex",
  openGraph: {
    title: "Onchain Test",
    description: "Bitcoin investments that never lose value.",
    url: "https://arells.com/onchaintest",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Onchain Test",
    description: "Bitcoin investments that never lose value.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const OnchainTestPage = () => {
  

  return (
    <>

      <div id="import-wrapper-concept">
            <OnchainTest/>
      </div>
    </>
  );
}

export default OnchainTestPage;