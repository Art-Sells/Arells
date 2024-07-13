import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/withdraw/withdraw.css';

import Withdraw from '../../components/Withdraw/Withdraw';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Withdraw",
  description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
  robots: "noimageindex",
  openGraph: {
    title: "Withdraw",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
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
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
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