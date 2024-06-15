import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/howitworks/howitworks.css';


import Bitcoin from '../../components/Bitcoin/bitcoin';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Buy & Sell Bitcoin",
  description: "Never lose money selling cryptocurrencies.",
  robots: "noimageindex",
  openGraph: {
    title: "Buy & Sell Bitcoin",
    description: "Never lose money selling cryptocurrencies.",
    url: "https://arells.com/bitcoin",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "Buy & Sell Bitcoin",
    description: "Never lose money selling cryptocurrencies.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  }
};

const BitcoinPage = () => {
  

  return (
    <>

      <div id="how-it-works-wrapper">
            <Bitcoin/>
      </div>
    </>
  );
}

export default BitcoinPage;