import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/bankaccount/bankaccount.css';

import BankAccount from '../../components/BankAccount/BankAccount';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Bank Account",
  description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
  robots: "noimageindex",
  openGraph: {
    title: "Bank Account",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    url: "https://arells.com/bankaccount",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Bank Account",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
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