import type { Metadata } from 'next';
import MetricsPageClient from './MetricsPageClient';

const generalBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/ArellsGeneralBanner.jpg';

export const metadata: Metadata = {
  title: 'Growth Metrics',
  description: 'Arells growth metrics',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Growth Metrics',
    description: 'Arells growth metrics',
    url: 'https://arells.com/metrics',
    type: 'website',
    images: [{ url: generalBanner }],
  },
  twitter: {
    title: 'Growth Metrics',
    description: 'Arells growth metrics',
    card: 'summary_large_image',
    images: [{ url: generalBanner }],
  },
};

export default function MetricsPage() {
  return <MetricsPageClient />;
}
