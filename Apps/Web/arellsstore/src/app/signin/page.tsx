import type { Metadata } from 'next';
import SignInPageClient from '../../components/Auth/SignInPageClient';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBanner.jpg';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to save investments.',
  robots: 'noimageindex',
  openGraph: {
    title: 'Sign in',
    description: 'Sign in to save investments.',
    url: 'https://arells.com/signin',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Sign in',
    description: 'Sign in to save investments.',
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function SignInPage() {
  return <SignInPageClient />;
}
