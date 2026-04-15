import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'About',
  description: 'Arells is a belief that investments should never lose value.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About',
    description: 'Arells is a belief that investments should never lose value.',
    url: '/about',
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
