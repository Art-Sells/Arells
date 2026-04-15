import type { Metadata } from 'next';
import { faviconUrl } from '../../lib/faviconUrl';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';

export const metadata: Metadata = {
  title: 'Ethereum',
  description: 'If investments never lost value.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/ethereum',
  },
  icons: {
    icon: faviconUrl('/images/favicons/EthBadge.svg'),
    shortcut: faviconUrl('/images/favicons/EthBadge.svg'),
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
