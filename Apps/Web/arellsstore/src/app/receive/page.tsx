import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/receive/receive.css';


import Receive from '../../components/Receive/Receive';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Receive",
  description: "Emotionally protects your investments from bear markets. Receive investments and emotionally protect yourself from bear market losses.",
  robots: "noimageindex",
  openGraph: {
    title: "Receive",
    description: "Emotionally protects your investments from bear markets. Receive investments and emotionally protect yourself from bear market losses.",
    url: "https://arells.com/receive",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Receive",
    description: "Emotionally protects your investments from bear markets. Receive investments and emotionally protect yourself from bear market losses.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const ReceivePage = () => {
  

  return (
    <>

      <div id="receive-wrapper">
            <Receive/>
      </div>
    </>
  );
}

export default ReceivePage;