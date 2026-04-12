import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'About',
  description: 'Arells is a belief that investments should never lose value.',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'About',
    description: 'Arells is a belief that investments should never lose value.',
    url: 'https://arells.com/about',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'About',
    description: 'Arells is a belief that investments should never lose value.',
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

const AboutPage = () => {
  return <AboutPageClient />;
};

export default AboutPage;
