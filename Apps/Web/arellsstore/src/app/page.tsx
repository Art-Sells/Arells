
// Change below link after test

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';
import { loadGuestPublicEarnings } from '../lib/portfolio/loadGuestPublicEarnings';
import { HOME_OG_BANNER } from '../lib/siteMetaDescriptions';

const description =
  'Investments never lose value with Arells. Arells is on a mission to ensure investments never lose value. Powered by Vavity. Now in Phase One of the mission.';

export const metadata: Metadata = {
  title: "Arells",
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Arells",
    description,
    url: "/",
    type: "website",
    images: [
      {
        url: HOME_OG_BANNER,
      }
    ]
  },
  twitter: {
    title: "Arells",
    description,
    card: "summary_large_image",
    images: [
      {
        url: HOME_OG_BANNER,
      }
    ]
  }
};

const Home = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <div id="overlayy">
      <Index initialPublicEarnings={initialPublicEarnings} />
    </div>
  );
};

export default Home;
