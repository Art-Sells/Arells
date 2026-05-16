
// Change below link after test

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "Investments never lose value.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Arells",
    description: "Investments never lose value.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/images/banners/ArellsGeneralBannerOfficial.jpg",
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "Investments never lose value.",
    card: "summary_large_image",
    images: [
      {
        url: "/images/banners/ArellsGeneralBannerOfficial.jpg",
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
