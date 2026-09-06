import type { Metadata } from 'next';
import TheBitcoinAlienRacePageClient from './TheBitcoinAlienRacePageClient';

const path = '/thebitcoinalienrace';
const title = 'The Bitcoin Alien Race';
const description =
  'In our universe, your Bitcoin investments are lifeless… But in another universe, they are alive, and are on a mission to live forever.';
const banner = '/images/banners/assets/crypto/Bitcoin/PremierBTCS1.jpg';

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
    images: [{ url: banner }],
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    images: [{ url: banner }],
  },
};

const TheBitcoinAlienRacePage = () => {
  return <TheBitcoinAlienRacePageClient />;
};

export default TheBitcoinAlienRacePage;
