import type { Metadata } from 'next';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';

export const metadata: Metadata = {
  title: 'Ethereum',
  description: 'If investments never lost value.',
  robots: { index: false, follow: true },
  icons: {
    icon: '/images/favicons/EthBadge.svg',
    shortcut: '/images/favicons/EthBadge.svg',
    /* iOS: use Arells PNG for touch / bookmarks; SVG badge stays on desktop tab via `icon`. */
    apple: '/ArellsIcoIcon.png',
  },
  openGraph: {
    title: 'Ethereum',
    description: 'If investments never lost value.',
    url: 'https://arells.com/ethereum',
    type: 'website',
    images: [
      {
        url: 'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/assets/crypto/Ethereum/ArellsETHBanner.jpg'
      }
    ]
  },
  twitter: {
    title: 'Arells',
    description: 'If investments never lost value.',
    card: 'summary_large_image',
    images: [
      {
        url: 'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/assets/crypto/Ethereum/ArellsETHBanner.jpg'
      }
    ]
  }
};

const EthereumPage = () => {
  return <EthereumPageClient />;
};

export default EthereumPage;
