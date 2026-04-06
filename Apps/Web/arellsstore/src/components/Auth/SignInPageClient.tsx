'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthPageShell from './AuthPageShell';

const SignInPageClient: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Sign in failed.');
        setErrorCode(typeof data.code === 'string' ? data.code : null);
        return;
      }
      router.push('/my-investments');
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      title="sign in"
      belowCard={
        <Link href="/signup" className="auth-secondary-link auth-submit--accent asset-range-button myinv-range-button">
          Sign up
        </Link>
      }
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <label className="auth-label" htmlFor="auth-signin-email">
          Email
        </label>
        <input
          id="auth-signin-email"
          className="auth-input"
          type="email"
          autoComplete="email"
          placeholder=" "
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
        <label className="auth-label" htmlFor="auth-signin-password">
          Password
        </label>
        <input
          id="auth-signin-password"
          className="auth-input"
          type="password"
          autoComplete="current-password"
          placeholder=" "
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
        <Link href="/forgot-password" className="auth-forgot-link">
          Forgot Password
        </Link>
        {error && (
          <p className={`auth-message auth-message--error auth-message--${errorCode || 'generic'}`} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="auth-submit asset-range-button myinv-range-button" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthPageShell>
  );
};

export default SignInPageClient;
