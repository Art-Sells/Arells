import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/transactions/transactions.css';

import Transactions from '../../components/Transactions/Transactions';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Transactions",
  description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
  robots: "noimageindex",
  openGraph: {
    title: "Transactions",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    url: "https://arells.com/transactions",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Transactions",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  }
};

const TransactionsPage = () => {
  

  return (
    <>

      <div id="transactions-wrapper">
            <Transactions/>
      </div>
    </>
  );
}

export default TransactionsPage;