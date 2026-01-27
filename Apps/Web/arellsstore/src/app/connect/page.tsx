import React from 'react';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Connect",
  description: "Bitcoin metrics and account overview.",
  robots: "noimageindex",
  openGraph: {
    title: "Connect",
    description: "Bitcoin metrics and account overview.",
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
    description: "Bitcoin metrics and account overview.",
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
        <div style={{ padding: '24px', color: '#ffffff' }}>
          Connectivity is disabled. This page now shows Bitcoin-only details in other sections.
        </div>
      </div>
    </>
  );
}

export default ConnectPage;