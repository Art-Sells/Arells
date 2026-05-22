import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'About',
  description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/about',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'About',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

const AboutPage = () => {
  return <AboutPageClient />;
};

export default AboutPage;
