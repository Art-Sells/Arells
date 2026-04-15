import type { Metadata } from 'next';
import ForgotPasswordPageClient from '../../components/Auth/ForgotPasswordPageClient';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Request a password reset for your account.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/forgot-password',
  },
  openGraph: {
    title: 'Forgot Password',
    description: 'Request a password reset for your account.',
    url: '/forgot-password',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Forgot Password',
    description: 'Request a password reset for your account.',
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
