import type { Metadata } from 'next';
import SignUpPageClient from '../../components/Auth/SignUpPageClient';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create an account to save investments.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Sign up',
    description: 'Create an account to save investments.',
    url: '/signup',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Sign up',
    description: 'Create an account to save investments.',
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}
