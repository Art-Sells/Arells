import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';
const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

const description =
  'Learn about Arells and Vavity. Investments can live forever. Now in Phase One.';

export const metadata: Metadata = {
  title: 'About',
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About',
    description,
    url: '/about',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'About',
    description,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

const AboutPage = () => {
  return <AboutPageClient />;
};

export default AboutPage;
