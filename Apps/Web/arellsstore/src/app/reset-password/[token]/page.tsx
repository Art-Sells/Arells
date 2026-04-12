import type { Metadata } from 'next';
import ResetPasswordPageClient from '../../../components/Auth/ResetPasswordPageClient';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your account.',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Reset Password',
    description: 'Set a new password for your account.',
    url: 'https://arells.com/reset-password',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Reset Password',
    description: 'Set a new password for your account.',
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
