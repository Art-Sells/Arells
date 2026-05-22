import type { Metadata } from 'next';
import SignUpPageClient from '../../components/Auth/SignUpPageClient';
import { SIGN_UP_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Sign up',
  description: SIGN_UP_META_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Sign up',
    description: SIGN_UP_META_DESCRIPTION,
    url: '/signup',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Sign up',
    description: SIGN_UP_META_DESCRIPTION,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}
