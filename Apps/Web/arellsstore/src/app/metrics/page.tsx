import type { Metadata } from 'next';
import MetricsPageClient from './MetricsPageClient';

const metricsOgImage =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/GrowthMetricsBanner.jpg';

export const metadata: Metadata = {
  title: 'Arells Growth Metrics',
  description: 'Growth and retention metrics for Arells',
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Arells Growth Metrics',
    description: 'Growth and retention metrics for Arells',
    url: 'https://arells.com/metrics',
    type: 'website',
    images: [{ url: metricsOgImage }],
  },
  twitter: {
    title: 'Arells Growth Metrics',
    description: 'Growth and retention metrics for Arells',
    card: 'summary_large_image',
    images: [{ url: metricsOgImage }],
  },
};

export default function MetricsPage() {
  return <MetricsPageClient />;
}
