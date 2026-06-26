import type { Metadata } from 'next';
import SignInPageClient from '../../components/Auth/SignInPageClient';
const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

const description =
  'Sign in to join our mission to ensure investments never lose value. Powered by Vavity.';

export const metadata: Metadata = {
  title: 'Sign in',
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/signin',
  },
  openGraph: {
    title: 'Sign in',
    description,
    url: '/signin',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Sign in',
    description,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function SignInPage() {
  return <SignInPageClient />;
}
