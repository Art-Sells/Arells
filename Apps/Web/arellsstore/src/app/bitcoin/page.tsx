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
    icon: "/images/favicons/BtcBadge.svg",
    shortcut: "/images/favicons/BtcBadge.svg",
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
