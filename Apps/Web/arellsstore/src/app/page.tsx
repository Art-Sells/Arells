
// Change below link after test

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../lib/siteMetaDescriptions';

export const metadata: Metadata = {
  title: "Arells",
  description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Arells",
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
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
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
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
    <div id="overlayy">
      <Index />
    </div>
  );
}

export default Home;
