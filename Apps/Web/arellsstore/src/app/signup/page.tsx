import type { Metadata } from 'next';
import SignUpPageClient from '../../components/Auth/SignUpPageClient';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create an account to save investments.',
  robots: { index: true, follow: true },
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
