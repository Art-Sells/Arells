import type { Metadata } from 'next';
import SignInPageClient from '../../components/Auth/SignInPageClient';
import { arellsIcoIconUrl } from '../../lib/faviconUrls';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to save investments.',
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: arellsIcoIconUrl, type: 'image/png', sizes: '32x32' }],
    apple: [{ url: arellsIcoIconUrl, sizes: '180x180', type: 'image/png' }],
  },
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
