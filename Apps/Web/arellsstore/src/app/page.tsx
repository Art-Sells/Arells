
// Change below link after test
import './css/Home.css';

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "Emotionally protects your investments from bear markets. Import investments and emotionally protect yourself from bear market losses.",
  robots: "noimageindex",
  openGraph: {
    title: "Arells",
    description: "Emotionally protects your investments from bear markets. Import investments and emotionally protect yourself from bear market losses.",
    url: "https://arells.com",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "Emotionally protects your investments from bear markets. Import investments and emotionally protect yourself from bear market losses.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const Home = () => {

  return (
    <>
        <div id="overlayy">
          <Index/>
        </div> 
    </>
  );
}

export default Home;
