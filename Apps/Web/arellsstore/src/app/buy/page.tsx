import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/buy/buy.css';

import type { Metadata } from 'next';
import Buy from '../../components/Buy/Buy';
export const metadata: Metadata = {
  title: "Buy",
  description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
  robots: "noimageindex",
  openGraph: {
    title: "Buy",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    url: "https://arells.com/buy",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Buy",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  }
};

const BuyPage = () => {
  

  return (
    <>

      <div id="buy-wrapper">
            <Buy/>
      </div>
    </>
  );
}

export default BuyPage;