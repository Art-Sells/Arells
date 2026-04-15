import type { Metadata } from 'next';
import { faviconUrl } from '../../../lib/faviconUrl';
import ResetPasswordPageClient from '../../../components/Auth/ResetPasswordPageClient';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

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
      icon: faviconUrl('/ArellsIcoIcon.png'),
      shortcut: faviconUrl('/ArellsIcoIcon.png'),
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
