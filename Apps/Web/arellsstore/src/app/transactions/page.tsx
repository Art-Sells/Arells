import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/transactions/transactions.css';

import Transactions from '../../components/Transactions/Transactions';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Transactions",
  description: "Always sell Bitcoin for Profits.",
  robots: "noimageindex",
  openGraph: {
    title: "Transactions",
    description: "Always sell Bitcoin for Profits.",
    url: "https://arells.com/transactions",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "Transactions",
    description: "Always sell Bitcoin for Profits.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
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