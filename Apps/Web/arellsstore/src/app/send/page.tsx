import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/send/send.css';


import Send from '../../components/Send/Send';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Send",
  description: "Emotionally protects your investments from bear markets. Receive investments and emotionally protect yourself from bear market losses.",
  robots: "noimageindex",
  openGraph: {
    title: "Send",
    description: "Emotionally protects your investments from bear markets. Receive investments and emotionally protect yourself from bear market losses.",
    url: "https://arells.com/send",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Send",
    description: "Emotionally protects your investments from bear markets. Receive investments and emotionally protect yourself from bear market losses.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const SendPage = () => {
  

  return (
    <>

      <div id="send-wrapper">
            <Send/>
      </div>
    </>
  );
}

export default SendPage;