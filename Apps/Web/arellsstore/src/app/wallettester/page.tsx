import React from 'react';

// Import other necessary components and hooks
import '../css/transactions/transactions.css';

import Bitcoin from '../../components/Bitcoin/bitcoin';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Wallet Tester",
  description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
  robots: "noimageindex",
  openGraph: {
    title: "Wallet Tester",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    url: "https://arells.com/wallettester",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Wallet Tester",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
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