import type { Metadata } from 'next';
import VerifiedPageClient from '../../../components/Auth/VerifiedPageClient';

const generalBanner = '/images/banners/ArellsGeneralBannerOfficial.jpg';

type Props = { params: { token: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = `/verified/${params.token}`;
  return {
    title: 'Verify email',
    description: 'Confirm your account email.',
    robots: { index: false, follow: true },
    alternates: {
      canonical: path,
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
    },
    openGraph: {
      title: 'Verify email',
      description: 'Confirm your account email.',
      url: path,
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
}

export default function VerifiedPage() {
  return <VerifiedPageClient />;
}
