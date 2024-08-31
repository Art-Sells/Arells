
// Change below link after test
import './css/Home.css';

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
  robots: "noimageindex",
  openGraph: {
    title: "Arells",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    url: "https://arells.com",
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

const Home = () => {

  return (
    <>
        <title>Arells</title>
        <meta name="description" content="Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits." />
        <meta name="robots" content="noimageindex" />
        <meta property="og:title" content="Arells" />
        <meta property="og:description" content="Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits." />
        <meta property="og:url" content="https://arells.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg" />
        <meta name="twitter:title" content="Arells" />
        <meta name="twitter:description" content="Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg" />
        <link rel="icon" href="/favicon.ico"></link>
        <div id="overlayy">
          <Index/>
        </div> 
    </>
  );
}

export default Home;
