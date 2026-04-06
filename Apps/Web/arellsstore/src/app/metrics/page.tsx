import type { Metadata } from 'next';
import MetricsPageClient from './MetricsPageClient';

export const metadata: Metadata = {
  title: 'Growth Metrics',
  robots: { index: false, follow: false },
};

export default function MetricsPage() {
  return <MetricsPageClient />;
}
