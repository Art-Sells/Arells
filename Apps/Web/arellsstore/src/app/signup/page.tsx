import type { Metadata } from 'next';
import SignUpPageClient from '../../components/Auth/SignUpPageClient';

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create an Arells account to save investments.',
  robots: 'noimageindex',
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}
