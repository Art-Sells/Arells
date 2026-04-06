import type { Metadata } from 'next';
import SignInPageClient from '../../components/Auth/SignInPageClient';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to save investments on Arells.',
  robots: 'noimageindex',
};

export default function SignInPage() {
  return <SignInPageClient />;
}
