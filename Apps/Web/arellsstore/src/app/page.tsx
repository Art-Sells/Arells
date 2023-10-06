
// Change below link after test
import './css/Home.css';

import { SignerProvider } from "state/signer";
import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "Never lose money selling art. With Arells, bear markets don't exist. Create and buy Digital Assets and always sell them at a profit.",
  robots: "noimageindex",
  httpEquiv: { "X-UA-Compatible": "IE=edge" },
  charSet: "UTF-8",
  linkCanonical: "https://arells.com",
  openGraph: {
    site_name: "Arells",
    title: "Arells",
    description: "Never lose money selling art. With Arells, bear markets don't exist. Create and buy Digital Assets and always sell them at a profit.",
    url: "https://arells.com",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "Never lose money selling art. With Arells, bear markets don't exist. Create and buy Digital Assets and always sell them at a profit.",
    url: "https://arells.com",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  }
};

const Home = () => {

  return (
    <>
      <SignerProvider>
        <div id="overlayy">
          <Index/>
        </div>
      </SignerProvider>    
    </>
  );
}

export default Home;