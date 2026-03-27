import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rules",
  description: "Learn how Vavity's autonomous financial system protects our investments from bear market losses. Discover autonomous protections and self-limiting systems.",
  keywords: "Vavity rules, autonomous financial system, bear markets, financial protections, price anchoring",
  authors: [{ name: "Vavity" }],
  creator: "Vavity",
  alternates: {
    canonical: "/vavity/rules",
  },
  openGraph: {
    title: "Rules",
    description: "Learn how Vavity's autonomous financial system protects our investments from bear market losses. Discover autonomous protections and self-limiting systems.",
    url: "/vavity/rules",
    siteName: "Vavity",
    images: [
      {
        url: "https://vavity.s3.us-east-1.amazonaws.com/Banner.jpg",
        width: 1200,
        height: 630,
        alt: "Rules",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rules",
    description: "Learn how Vavity's autonomous financial system protects our investments from bear market losses. Discover autonomous protections and self-limiting systems.",
    images: ["https://vavity.s3.us-east-1.amazonaws.com/Banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Rules",
    description: "Learn how Vavity's autonomous financial system protects our investments from bear market losses. Discover autonomous protections and self-limiting systems.",
    "url": "https://vavity.info/rules",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Vavity",
      "url": "https://vavity.info"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
