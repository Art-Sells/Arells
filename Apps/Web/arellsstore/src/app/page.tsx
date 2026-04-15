
// Change below link after test

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';
import { faviconUrl } from '../lib/faviconUrl';

export const metadata: Metadata = {
  title: "Arells",
  description: "If investments never lost value.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: faviconUrl('/ArellsIcoIcon.png'),
    shortcut: faviconUrl('/ArellsIcoIcon.png'),
  },
  openGraph: {
    title: "Arells",
    description: "If investments never lost value.",
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
    description: "If investments never lost value.",
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
