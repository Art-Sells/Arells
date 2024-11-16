import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/withdraw/withdraw.css';

import Withdraw from '../../components/Withdraw/Withdraw';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Withdraw",
  description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
  robots: "noimageindex",
  openGraph: {
    title: "Withdraw",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    url: "https://arells.com/withdraw",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Withdraw",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  }
};

const WithdrawPage = () => {
  

  return (
    <>

      <div id="withdraw-wrapper">
            <Withdraw/>
      </div>
    </>
  );
}

export default WithdrawPage;