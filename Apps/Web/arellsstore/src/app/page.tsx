
// Change below link after test
import './css/Home.css';

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "Sell art that never loses value. With Arells bear markets are obsolete.",
  robots: "noimageindex",
  openGraph: {
    title: "Arells",
    description: "Sell art that never loses value. With Arells bear markets are obsolete.",
    url: "https://arells.com",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "Sell art that never loses value. With Arells bear markets are obsolete.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"
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
