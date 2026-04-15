
// Change below link after test

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Arells",
  description: "If investments never lost value.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: "/ArellsIcoIcon.png",
    shortcut: "/ArellsIcoIcon.png",
  },
  openGraph: {
    title: "Arells",
    description: "If investments never lost value.",
    url: "/",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "If investments never lost value.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg"
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
