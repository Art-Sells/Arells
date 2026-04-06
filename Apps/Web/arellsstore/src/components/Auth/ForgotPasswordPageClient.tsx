'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import { EMAIL_RE, normalizeEmail } from '../../lib/auth/normalize';
import { isEmailRelatedAuthError } from '../../lib/auth/authFieldErrors';

const ForgotPasswordPageClient: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<'form' | 'loading' | 'sent'>('form');
  const [fadeOut, setFadeOut] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    const em = normalizeEmail(email);
    if (!em) {
      setError('Please enter your email.');
      setErrorCode('REQUIRED_EMAIL');
      return;
    }
    if (!EMAIL_RE.test(em)) {
      setError('Email format is incorrect.');
      setErrorCode('INVALID_EMAIL');
      return;
    }
    setPhase('loading');
    setFadeOut(false);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: em,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase('form');
        setError(typeof data.error === 'string' ? data.error : 'Something went wrong.');
        setErrorCode(typeof data.code === 'string' ? data.code : null);
        return;
      }
      window.setTimeout(() => setFadeOut(true), 800);
      window.setTimeout(() => {
        setPhase('sent');
        setSentTo(em);
      }, 2800);
    } catch {
      setPhase('form');
      setError('Something went wrong. Try again.');
    }
  };

  return (
    <>
      {phase === 'loading' && (
        <div className={`asset-loader-overlay myinv-loader-overlay${fadeOut ? ' asset-loader-overlay-fade' : ''}`}>
          <div className="loader-toggle-clone loader-toggle-clone--myinv">
            <div className="myinv-toggle-shell myinv-accent-border">
              <div className="asset-reality-toggle-row myinv-toggle-row">
                <span className="asset-reality-toggle-label">Liquid</span>
                <button type="button" className="asset-reality-toggle" aria-hidden="true" tabIndex={-1}>
                  <span className="asset-reality-toggle-knob" aria-hidden="true" />
                </button>
                <span className="asset-reality-toggle-label">Solid</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <AuthPageShell title="forgot password">
        {phase === 'sent' ? (
          <div className="auth-verify-sent">
            <p className="auth-verify-sent-title">Password reset e-mail sent to {sentTo}</p>
            <p className="auth-verify-sent-sub">Check your inbox to continue.</p>
            <Link href="/signin" className="auth-submit asset-range-button myinv-range-button">
              Back to sign in
            </Link>
          </div>
        ) : phase === 'form' ? (
          <>
            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <label className="auth-label" htmlFor="auth-forgot-email">
                Email
              </label>
              <input
                id="auth-forgot-email"
                className="auth-input"
                type="email"
                autoComplete="email"
                placeholder=" "
                value={email}
                onChange={(ev) => {
                  setEmail(ev.target.value);
                  setErrorCode((c) => {
                    if (isEmailRelatedAuthError(c)) {
                      setError(null);
                      return null;
                    }
                    return c;
                  });
                }}
              />
              <AuthFormMessage error={error} errorCode={errorCode} />
              <button type="submit" className="auth-submit asset-range-button myinv-range-button">
                Reset Password
              </button>
            </form>
            <div className="auth-below-card">
              <Link href="/signin" className="auth-secondary-link asset-range-button myinv-range-button">
                Back to sign in
              </Link>
            </div>
          </>
        ) : null}
      </AuthPageShell>
    </>
  );
};

export default ForgotPasswordPageClient;
