import type { Metadata } from 'next';
import SignUpPageClient from '../../components/Auth/SignUpPageClient';
const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

const description =
  'Sign up to join our mission to ensure investments never lose value. Powered by Vavity.';

export const metadata: Metadata = {
  title: 'Sign up',
  description,
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Sign up',
    description,
    url: '/signup',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Sign up',
    description,
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}
