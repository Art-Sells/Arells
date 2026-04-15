import type { Metadata } from 'next';
import BitcoinPageClient from '../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
export const metadata: Metadata = {
  title: "Bitcoin",
  description: "If investments never lost value.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/bitcoin',
  },
  icons: {
    /* Next emits `shortcut icon` links BEFORE `icon`; pointing shortcut at /favicon.ico forced the global Arells tab icon here. */
    shortcut: '/images/favicons/BtcBadge.svg',
    icon: [
      { url: '/images/favicons/BtcBadge.svg', type: 'image/svg+xml' },
      { url: '/ArellsIcoIcon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/images/favicons/BtcBadge.svg', type: 'image/svg+xml', sizes: '180x180' }],
  },
  openGraph: {
    title: "Bitcoin",
    description: "If investments never lost value.",
    url: "/bitcoin",
    type: "website",
    images: [
      {
        url: "/images/banners/assets/crypto/Bitcoin/ArellsBTCBanner.jpg",
      }
    ]
  },
  twitter: {
    title: "Bitcoin",
    description: "If investments never lost value.",
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
