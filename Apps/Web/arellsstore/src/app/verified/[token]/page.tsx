import type { Metadata } from 'next';
import VerifiedPageClient from '../../../components/Auth/VerifiedPageClient';

export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Confirm your account email.',
  robots: 'noimageindex',
};

export default function VerifiedPage() {
  return <VerifiedPageClient />;
}
