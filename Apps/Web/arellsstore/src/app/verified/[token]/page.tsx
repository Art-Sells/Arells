import type { Metadata } from 'next';
import VerifiedPageClient from '../../../components/Auth/VerifiedPageClient';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Confirm your account email.',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Verify email',
    description: 'Confirm your account email.',
    url: 'https://arells.com/verified',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Verify email',
    description: 'Confirm your account email.',
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function VerifiedPage() {
  return <VerifiedPageClient />;
}
