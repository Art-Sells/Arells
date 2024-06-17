import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/bitcoin/BitcoinWalletCreated.css';

import type { Metadata } from 'next';
import BitcoinWalletCreated from '../../components/BitcoinWallet/BitcoinWallet';
export const metadata: Metadata = {
  title: "Bitcoin Wallet Created",
  description: "Never lose money selling cryptocurrencies.",
  robots: "noimageindex",
  openGraph: {
    title: "Bitcoin Wallet Created",
    description: "Never lose money selling cryptocurrencies.",
    url: "https://arells.com/bitcoin_wallet_created",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "Bitcoin Wallet Created",
    description: "Never lose money selling cryptocurrencies.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  }
};

const BitcoinWalletCreatedPage = () => {
  

  return (
    <>

      <div id="bitcoinwalletcreated-wrapper">
            <BitcoinWalletCreated/>
      </div>
    </>
  );
}

export default BitcoinWalletCreatedPage;