import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/loginsignup/loginsignup.css';

import Sell from '../../components/Sell/Sell';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Sell",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    robots: "noimageindex",
    openGraph: {
      title: "Sell",
      description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
      url: "https://arells.com/sell",
      type: "website",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
        }
      ]
    },
    twitter: {
      title: "Sell",
      description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
      card: "summary_large_image",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
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