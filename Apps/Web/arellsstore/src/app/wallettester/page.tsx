import React from 'react';

// Import other necessary components and hooks
import '../css/transactions/transactions.css';

import Bitcoin from '../../components/Bitcoin/bitcoin';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Wallet Tester",
  description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
  robots: "noimageindex",
  openGraph: {
    title: "Wallet Tester",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    url: "https://arells.com/wallettester",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Wallet Tester",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  }
};

const WalletTesterPage = () => {
  

  return (
    <>

      <div id="transactions-wrapper">
            <Bitcoin/>
      </div>
    </>
  );
}

export default WalletTesterPage;