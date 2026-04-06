import type { Metadata } from 'next';
import ForgotPasswordPageClient from '../../components/Auth/ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Request a password reset for your Arells account.',
  robots: 'noimageindex',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
