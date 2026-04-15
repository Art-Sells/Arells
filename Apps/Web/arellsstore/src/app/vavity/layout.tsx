import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vavity - Virtual Autonomous Volatility Immunizing Tethering Yielder",
  description: "An autonomous pricing system that anchors asset prices before they fall.",
  keywords: "Vavity, autonomous financial system, bear markets, asset prices, financial technology, DeFi, cryptocurrency, blockchain, price anchoring",
  authors: [{ name: "Vavity" }],
  creator: "Vavity",
  alternates: {
    canonical: "/vavity",
  },
  icons: {
    shortcut: '/images/vavity/favicon.png',
    icon: [
      { url: '/images/vavity/favicon.png', type: 'image/png', sizes: '192x192' },
      { url: '/images/vavity/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/images/vavity/favicon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: "Vavity - Virtual Autonomous Volatility Immunizing Tethering Yielder",
    description: "An autonomous pricing system that anchors asset prices before they fall.",
    url: "/vavity",
    siteName: "Vavity",
    images: [
      {
        url: "/images/vavity/Banner.jpg",
        width: 1200,
        height: 1200,
        alt: "Vavity - An autonomous pricing system that anchors asset prices before they fall.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vavity - Virtual Autonomous Volatility Immunizing Tethering Yielder",
    description: "An autonomous pricing system that anchors asset prices before they fall.",
    images: ["/images/vavity/Banner.jpg"],
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function VavityLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vavity",
    "description": "An autonomous pricing system that anchors asset prices before they fall.",
    "url": "https://vavity.info",
    "logo": "https://vavity.info/images/Vavity-Icon-Ivory.png",
    "sameAs": [
      "https://github.com/Art-Sells/Vavity"
    ]
  };

  return (
    <div className={inter.variable} style={{
      fontFamily: 'var(--font-inter), Arial, Helvetica, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale' as never,
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}
