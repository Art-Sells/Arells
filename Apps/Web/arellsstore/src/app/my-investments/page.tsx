import type { Metadata } from 'next';
import MyInvestmentsPageClient from '../../components/MyInvestments/MyInvestmentsPageClient';

const myInvestmentsBanner =
  'https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/MyInvestmentsBanner.jpg';

export const metadata: Metadata = {
  title: 'My Investments',
  description: 'If investments never lost value.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/my-investments',
  },
  openGraph: {
    title: 'My Investments',
    description: 'If investments never lost value.',
    url: '/my-investments',
    type: 'website',
    images: [{ url: myInvestmentsBanner }],
  },
  twitter: {
    title: 'My Investments',
    description: 'If investments never lost value.',
    card: 'summary_large_image',
    images: [{ url: myInvestmentsBanner }],
  },
};

const MyInvestmentsPage = () => {
  return <MyInvestmentsPageClient />;
};

export default MyInvestmentsPage;

