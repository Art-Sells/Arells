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
    /* SVG first for capable desktops; ICO/PNG follow so Android Chrome can skip SVG and still hit same-origin icons. */
    icon: [
      { url: '/images/favicons/BtcBadge.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/ArellsIcoIcon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/ArellsIcoIcon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
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
