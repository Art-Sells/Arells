import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/buy/buy.css';

import type { Metadata } from 'next';
import Buy from '../../components/Buy/Buy';
export const metadata: Metadata = {
  title: "Buy",
  description: "Never lose money selling cryptocurrencies.",
  robots: "noimageindex",
  openGraph: {
    title: "Buy",
    description: "Never lose money selling cryptocurrencies.",
    url: "https://arells.com/buy",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "Buy",
    description: "Never lose money selling cryptocurrencies.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
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