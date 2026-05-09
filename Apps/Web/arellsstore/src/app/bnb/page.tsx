import type { Metadata } from 'next';
import BnbPageClient from '../../components/Assets/Crypto/Bnb/BnbPageClient';
import { iconAssetUrl as u } from '../../lib/iconAssetUrl';

export const metadata: Metadata = {
  title: 'BNB should never lose value',
  description: 'Investments should never lose value.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/bnb',
  },
  icons: {
    /* Next emits shortcut before icon; default layout shortcut is ArellsFavicon.ico — override so /bnb tab shows BNB badge. */
    shortcut: u('/images/favicons/BnbBadge.svg'),
    icon: [
      { url: u('/images/favicons/BnbBadge.svg'), type: 'image/svg+xml' },
      { url: u('/ArellsIcon.png'), type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: u('/images/favicons/BnbBadge.svg'), type: 'image/svg+xml', sizes: '180x180' }],
  },
  openGraph: {
    title: 'BNB should never lose value',
    description: 'Investments should never lose value.',
    url: '/bnb',
    type: 'website',
    images: [
      {
        url: '/images/banners/assets/crypto/BNB/ArellsBNBBanner.jpg',
      },
    ],
  },
  twitter: {
    title: 'BNB should never lose value',
    description: 'Investments should never lose value.',
    card: 'summary_large_image',
    images: [
      {
        url: '/images/banners/assets/crypto/BNB/ArellsBNBBanner.jpg',
      },
    ],
  },
};

const BnbPage = () => {
  return <BnbPageClient />;
};

export default BnbPage;
