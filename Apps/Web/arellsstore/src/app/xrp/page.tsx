import type { Metadata } from 'next';
import XrpPageClient from '../../components/Assets/Crypto/Xrp/XrpPageClient';
import { iconAssetUrl as u } from '../../lib/iconAssetUrl';

export const metadata: Metadata = {
  title: 'XRP',
  description: 'If investments never lost value.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/xrp',
  },
  icons: {
    shortcut: u('/images/favicons/XrpBadge.svg'),
    icon: [
      { url: u('/images/favicons/XrpBadge.svg'), type: 'image/svg+xml' },
      { url: u('/ArellsIcon.png'), type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: u('/images/favicons/XrpBadge.svg'), type: 'image/svg+xml', sizes: '180x180' }],
  },
  openGraph: {
    title: 'XRP',
    description: 'If investments never lost value.',
    url: '/xrp',
    type: 'website',
    images: [
      {
        url: '/images/banners/assets/crypto/XRP/ArellsXRPBanner.jpg',
      },
    ],
  },
  twitter: {
    title: 'XRP',
    description: 'If investments never lost value.',
    card: 'summary_large_image',
    images: [
      {
        url: '/images/banners/assets/crypto/XRP/ArellsXRPBanner.jpg',
      },
    ],
  },
};

const XrpPage = () => {
  return <XrpPageClient />;
};

export default XrpPage;
