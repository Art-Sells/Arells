import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminologies",
  description: "Learn about Vavity's terminologies.",
  keywords: "Vavity terminologies, VAPA, Vatop, Vact, price anchoring, asset pricing",
  authors: [{ name: "Vavity" }],
  creator: "Vavity",
  alternates: {
    canonical: "/vavity/terminologies",
  },
  openGraph: {
    title: "Terminologies",
    description: "Learn about Vavity's terminologies.",
    url: "/vavity/terminologies",
    siteName: "Vavity",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/vavity/VavityBanner.jpg",
        width: 1200,
        height: 1200,
        alt: "Terminologies",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terminologies",
    description: "Learn about Vavity's terminologies.",
    images: ["https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/vavity/VavityBanner.jpg"],
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

export default function TerminologiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terminologies",
    description: "Learn about Vavity's terminologies.",
    "url": "https://vavity.info/terminologies",
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
