
// Change below link after test
import './css/Home.css';

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "if investments never lost value Connect your investments.",
  robots: "noimageindex",
  icons: {
    icon: "/ArellsIcoIcon.png",
    shortcut: "/ArellsIcoIcon.png",
    apple: "/ArellsIcoIcon.png"
  },
  openGraph: {
    title: "Arells",
    description: "if investments never lost value Connect your investments.",
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
    description: "if investments never lost value Connect your investments.",
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
