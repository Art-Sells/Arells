import type { Metadata } from 'next';
import BitcoinPageClient from '../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
import { iconAssetUrl as u } from '../../lib/iconAssetUrl';

export const metadata: Metadata = {
  title: "Bitcoin should never lose value",
  description: "Investments should never lose value.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: '/bitcoin',
  },
  icons: {
    /* Next emits `shortcut icon` links BEFORE `icon`; pointing shortcut at /ArellsFavicon.ico forced the global Arells tab icon here. */
    shortcut: u('/images/favicons/BtcBadge.svg'),
    icon: [
      { url: u('/images/favicons/BtcBadge.svg'), type: 'image/svg+xml' },
      { url: u('/ArellsIcon.png'), type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: u('/images/favicons/BtcBadge.svg'), type: 'image/svg+xml', sizes: '180x180' }],
  },
  openGraph: {
    title: "Bitcoin should never lose value",
    description: "Investments should never lose value.",
    url: "/bitcoin",
    type: "website",
    images: [
      {
        url: "/images/banners/assets/crypto/Bitcoin/ArellsBTCBanner.jpg",
      }
    ]
  },
  twitter: {
    title: "Bitcoin should never lose value",
    description: "Investments should never lose value.",
    card: "summary_large_image",
    images: [
      {
        url: "/images/banners/assets/crypto/Bitcoin/ArellsBTCBanner.jpg",
      }
    ]
  }
};

const BitcoinPage = () => {
  return <BitcoinPageClient />;
};

export default BitcoinPage;
