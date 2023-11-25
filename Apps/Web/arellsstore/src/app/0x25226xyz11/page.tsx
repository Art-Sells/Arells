
// Change below link after test
import '../css/Home.css';

import Vault from '../../components/Vault';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "Never lose money selling art. With Arells, bear markets don't exist. Create and buy Digital Assets and always sell them at a profit.",
  robots: "noimageindex",
  openGraph: {
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
        <div id="overlayy">
          <Vault/>
        </div> 
    </>
  );
}

export default Home;