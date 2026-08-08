import type { Metadata } from 'next';
import TheBitcoinAlienRacePageClient from './TheBitcoinAlienRacePageClient';
import { HOME_OG_BANNER } from '../../lib/siteMetaDescriptions';

const path = '/thebitcoinalienrace';
const title = 'The Bitcoin Alien Race';
const description =
  'In our universe, your Bitcoin investments are lifeless… But in another universe, they are alive, and are on a mission to live forever.';

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: path,
  },
  openGraph: {
    title,
    description,
    url: path,
    type: 'website',
    images: [{ url: HOME_OG_BANNER }],
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    images: [{ url: HOME_OG_BANNER }],
  },
};

const TheBitcoinAlienRacePage = () => {
  return <TheBitcoinAlienRacePageClient />;
};

export default TheBitcoinAlienRacePage;
