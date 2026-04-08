import type { Metadata } from 'next';
import ResetPasswordPageClient from '../../../components/Auth/ResetPasswordPageClient';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your account.',
  robots: 'noimageindex',
};

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
