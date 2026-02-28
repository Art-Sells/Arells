import type { Metadata } from 'next';
import MyInvestmentsPageClient from '../../components/MyInvestments/MyInvestmentsPageClient';

export const metadata: Metadata = {
  title: 'My Investments',
  description: 'if investments never lost value.',
  robots: 'noimageindex',
};

const MyInvestmentsPage = () => {
  return <MyInvestmentsPageClient />;
};

export default MyInvestmentsPage;

