import type { Metadata } from 'next';
import SolanaPageClient from '../../components/Assets/Crypto/Solana/SolanaPageClient';
import { iconAssetUrl as u } from '../../lib/iconAssetUrl';

export const metadata: Metadata = {
  title: 'Solana',
  description: 'Investments should never lose value.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/solana',
  },
  icons: {
    shortcut: u('/images/favicons/SolBadge.svg'),
    icon: [
      { url: u('/images/favicons/SolBadge.svg'), type: 'image/svg+xml' },
      { url: u('/ArellsIcon.png'), type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: u('/images/favicons/SolBadge.svg'), type: 'image/svg+xml', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Solana',
    description: 'Investments should never lose value.',
    url: '/solana',
    type: 'website',
    images: [
      {
        url: '/images/banners/assets/crypto/Solana/ArellsSOLBanner.jpg',
      },
    ],
  },
  twitter: {
    title: 'Solana',
    description: 'Investments should never lose value.',
    card: 'summary_large_image',
    images: [
      {
        url: '/images/banners/assets/crypto/Solana/ArellsSOLBanner.jpg',
      },
    ],
  },
};

const SolanaPage = () => {
  return <SolanaPageClient />;
};

export default SolanaPage;
