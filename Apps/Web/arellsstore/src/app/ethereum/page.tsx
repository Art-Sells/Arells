import type { Metadata } from 'next';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';
import { iconAssetUrl as u } from '../../lib/iconAssetUrl';

export const metadata: Metadata = {
  title: 'Ethereum should never lose value',
  description: 'Investments should never lose value.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/ethereum',
  },
  icons: {
    shortcut: u('/images/favicons/EthBadge.svg'),
    icon: [{ url: u('/images/favicons/EthBadge.svg'), type: 'image/svg+xml' }],
    apple: [{ url: u('/images/favicons/EthBadge.svg'), type: 'image/svg+xml', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Ethereum should never lose value',
    description: 'Investments should never lose value.',
    url: '/ethereum',
    type: 'website',
    images: [
      {
        url: '/images/banners/assets/crypto/Ethereum/ArellsETHBanner.jpg',
      }
    ]
  },
  twitter: {
    title: 'Ethereum should never lose value',
    description: 'Investments should never lose value.',
    card: 'summary_large_image',
    images: [
      {
        url: '/images/banners/assets/crypto/Ethereum/ArellsETHBanner.jpg',
      }
    ]
  }
};

const EthereumPage = () => {
  return <EthereumPageClient />;
};

export default EthereumPage;
