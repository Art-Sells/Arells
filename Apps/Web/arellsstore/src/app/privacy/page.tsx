import type { Metadata } from 'next';
import PrivacyPageClient from './PrivacyPageClient';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

const description =
  'Privacy Policy for Arells — how we collect, use, and protect your information.';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy',
    description,
    url: '/privacy',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Privacy Policy',
    description,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

const PrivacyPage = () => {
  return <PrivacyPageClient />;
};

export default PrivacyPage;
