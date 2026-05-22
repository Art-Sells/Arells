import type { Metadata } from 'next';
import SignInPageClient from '../../components/Auth/SignInPageClient';
import { SIGN_IN_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Sign in',
  description: SIGN_IN_META_DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/signin',
  },
  openGraph: {
    title: 'Sign in',
    description: SIGN_IN_META_DESCRIPTION,
    url: '/signin',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Sign in',
    description: SIGN_IN_META_DESCRIPTION,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function SignInPage() {
  return <SignInPageClient />;
}
