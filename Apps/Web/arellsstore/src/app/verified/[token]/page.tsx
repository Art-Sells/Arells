import type { Metadata } from 'next';
import { faviconUrl } from '../../../lib/faviconUrl';
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
      icon: faviconUrl('/ArellsIcoIcon.png'),
      shortcut: faviconUrl('/ArellsIcoIcon.png'),
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
