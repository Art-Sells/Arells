import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/howitworks/howitworks.css';


import HowItWorks from '../../components/HowTo/HowItWorks';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "How It Works",
  description: "Never lose money selling cryptocurrencies.",
  robots: "noimageindex",
  openGraph: {
    title: "How It Works",
    description: "Never lose money selling cryptocurrencies.",
    url: "https://arells.com/howitworks",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "How It Works",
    description: "Never lose money selling cryptocurrencies.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  }
};

const HowItWorksPage = () => {
  

  return (
    <>

      <div id="how-it-works-wrapper">
            <HowItWorks/>
      </div>
    </>
  );
}

export default HowItWorksPage;