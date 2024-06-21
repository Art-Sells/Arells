import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/account/Account.css';

import type { Metadata } from 'next';
import Account from '../../components/Account/Account';
export const metadata: Metadata = {
  title: "Arells",
  description: "Never lose money selling cryptocurrencies.",
  robots: "noimageindex",
  openGraph: {
    title: "Arells",
    description: "Never lose money selling cryptocurrencies.",
    url: "https://arells.com/account",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "Never lose money selling cryptocurrencies.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  }
};

const AccountPage = () => {
  

  return (
    <>

      <div id="account-wrapper">
            <Account/>
      </div>
    </>
  );
}

export default AccountPage;