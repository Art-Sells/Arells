import type { Metadata } from 'next';
import ResetPasswordPageClient from '../../../components/Auth/ResetPasswordPageClient';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBannerOfficial.jpg';

type Props = { params: { token: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/reset-password/${params.token}`;
  return {
    title: 'Reset Password',
    description: 'Set a new password for your account.',
    robots: { index: false, follow: true },
    alternates: {
      canonical: path,
    },
    icons: {
      icon: '/ArellsIcoIcon.png',
      shortcut: '/ArellsIcoIcon.png',
    },
    openGraph: {
      title: 'Reset Password',
      description: 'Set a new password for your account.',
      url: path,
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
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
