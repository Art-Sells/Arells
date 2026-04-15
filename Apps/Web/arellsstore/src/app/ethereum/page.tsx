import type { Metadata } from 'next';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';

export const metadata: Metadata = {
  title: 'Ethereum',
  description: 'If investments never lost value.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/ethereum',
  },
  icons: {
    icon: [
      { url: '/images/favicons/EthBadge.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/ArellsIcoIcon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/ArellsIcoIcon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Ethereum',
    description: 'If investments never lost value.',
    url: '/ethereum',
    type: 'website',
    images: [
      {
        url: '/images/banners/assets/crypto/Ethereum/ArellsETHBanner.jpg',
      }
    ]
  },
  twitter: {
    title: 'Ethereum',
    description: 'If investments never lost value.',
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
