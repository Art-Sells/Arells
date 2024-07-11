import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/loginsignup/loginsignup.css';

import Sell from '../../components/Sell/Sell';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Sell",
    description: "Always sell bitcoin for profits.",
    robots: "noimageindex",
    openGraph: {
      title: "Sell",
      description: "Always sell bitcoin for profits.",
      url: "https://arells.com/sell",
      type: "website",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
        }
      ]
    },
    twitter: {
      title: "Sell",
      description: "Always sell bitcoin for profits.",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
        }
      ]
    }
  };

const SellPage = () => {
  

  return (
    <>

      <div id="sell-wrapper">
            <Sell/>
      </div>
    </>
  );
}

export default SellPage;