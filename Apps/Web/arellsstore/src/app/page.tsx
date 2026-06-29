
// Change below link after test

import Index from '../components/Index';
import React from 'react';
import type { Metadata } from 'next';
import { loadGuestPublicEarnings } from '../lib/portfolio/loadGuestPublicEarnings';
import { buildWebPageJsonLd } from '../lib/pageWebPageJsonLd';
import { HOME_OG_BANNER } from '../lib/siteMetaDescriptions';

const title = 'Arells';
const description =
  'Investments never lose value with Arells. Arells is on a mission to ensure investments never lose value. Powered by Vavity. Now in Phase One of the mission.';

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title,
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
    title,
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
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <Index initialPublicEarnings={initialPublicEarnings} />
      </main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script injection
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebPageJsonLd({ title, description, path: '/' })),
        }}
      />
    </div>
  );
};

export default Home;
