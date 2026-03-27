import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminologies",
  description: "Vavity terminologies: VAPA, Vatop, Vact, and calculation scenarios for autonomous price anchoring.",
  keywords: "Vavity terminologies, VAPA, Vatop, Vact, price anchoring, asset pricing",
  authors: [{ name: "Vavity" }],
  creator: "Vavity",
  alternates: {
    canonical: "/vavity/terminologies",
  },
  openGraph: {
    title: "Terminologies",
    description: "Vavity terminologies: VAPA, Vatop, Vact, and calculation scenarios for autonomous price anchoring.",
    url: "/vavity/terminologies",
    siteName: "Vavity",
    images: [
      {
        url: "https://vavity.s3.us-east-1.amazonaws.com/Banner.jpg",
        width: 1200,
        height: 630,
        alt: "Terminologies",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terminologies",
    description: "Vavity terminologies: VAPA, Vatop, Vact, and calculation scenarios for autonomous price anchoring.",
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

export default function TerminologiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terminologies",
    description: "Vavity terminologies: VAPA, Vatop, Vact, and calculation scenarios for autonomous price anchoring.",
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
