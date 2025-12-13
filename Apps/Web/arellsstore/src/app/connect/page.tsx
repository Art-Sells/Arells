import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/connect/connect.css';


import Connect from '../../components/Connect/Connect';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Connect",
  description: "Emotionally protects your investments from bear markets. Connect your wallet and emotionally protect yourself from bear market losses.",
  robots: "noimageindex",
  openGraph: {
    title: "Connect",
    description: "Emotionally protects your investments from bear markets. Connect your wallet and emotionally protect yourself from bear market losses.",
    url: "https://arells.com/connect",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Connect",
    description: "Emotionally protects your investments from bear markets. Connect your wallet and emotionally protect yourself from bear market losses.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const ConnectPage = () => {
  

  return (
    <>

      <div id="connect-wrapper">
            <Connect/>
      </div>
    </>
  );
}

export default ConnectPage;