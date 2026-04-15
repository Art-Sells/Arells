import type { Metadata } from 'next';
import SignInPageClient from '../../components/Auth/SignInPageClient';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to save investments.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/signin',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Sign in',
    description: 'Sign in to save investments.',
    url: '/signin',
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
