import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/bankaccount/bankaccount.css';

import BankAccount from '../../components/BankAccount/BankAccount';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Bank Account",
  description: "Never lose money selling cryptocurrencies.",
  robots: "noimageindex",
  openGraph: {
    title: "Bank Account",
    description: "Never lose money selling cryptocurrencies.",
    url: "https://arells.com/bankaccount",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "Bank Account",
    description: "Never lose money selling cryptocurrencies.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  }
};

const BankAccountPage = () => {
  

  return (
    <>

      <div id="bankaccount-wrapper">
            <BankAccount/>
      </div>
    </>
  );
}

export default BankAccountPage;