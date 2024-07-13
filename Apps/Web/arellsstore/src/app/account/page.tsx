import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/account/Account.css';

import type { Metadata } from 'next';
import Account from '../../components/Account/Account';
export const metadata: Metadata = {
  title: "Arells",
  description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
  robots: "noimageindex",
  openGraph: {
    title: "Arells",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    url: "https://arells.com/account",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
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