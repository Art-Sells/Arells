import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/withdraw/withdraw.css';

import Withdraw from '../../components/Withdraw/Withdraw';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Withdraw",
  description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
  robots: "noimageindex",
  openGraph: {
    title: "Withdraw",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    url: "https://arells.com/withdraw",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Withdraw",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
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