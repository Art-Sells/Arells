'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import { EMAIL_RE, normalizeEmail } from '../../lib/auth/normalize';
import {
  isConfirmFieldAuthError,
  isEmailRelatedAuthError,
  isPasswordFieldAuthError,
} from '../../lib/auth/authFieldErrors';

const SignUpPageClient: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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
    if (!password) {
      setError('Please enter a password.');
      setErrorCode('REQUIRED_PASSWORD');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setErrorCode('PASSWORD_SHORT');
      return;
    }
    if (!passwordConfirm) {
      setError('Please confirm your password.');
      setErrorCode('REQUIRED_CONFIRM');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      setErrorCode('PASSWORD_MISMATCH');
      return;
    }
    setPhase('loading');
    setFadeOut(false);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: em,
          password,
          passwordConfirm,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase('form');
        setError(typeof data.error === 'string' ? data.error : 'Sign up failed.');
        setErrorCode(typeof data.code === 'string' ? data.code : null);
        return;
      }
      window.setTimeout(() => setFadeOut(true), 800);
      window.setTimeout(() => {
        setPhase('sent');
        setSentTo(typeof data.email === 'string' ? data.email : email);
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
      <AuthPageShell title="sign up">
        {phase === 'sent' ? (
          <div className="auth-verify-sent">
            <p className="auth-verify-sent-title">Verification e-mail sent to {sentTo}</p>
            <p className="auth-verify-sent-sub">Verify e-mail before continuing.</p>
            <Link href="/signin" className="auth-submit asset-range-button myinv-range-button">
              Back to sign in
            </Link>
          </div>
        ) : phase === 'form' ? (
          <>
            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <label className="auth-label" htmlFor="auth-signup-email">
                Email
              </label>
              <input
                id="auth-signup-email"
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
              <label className="auth-label" htmlFor="auth-signup-password">
                Password
              </label>
              <input
                id="auth-signup-password"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                placeholder=" "
                value={password}
                onChange={(ev) => {
                  setPassword(ev.target.value);
                  setErrorCode((c) => {
                    if (isPasswordFieldAuthError(c)) {
                      setError(null);
                      return null;
                    }
                    return c;
                  });
                }}
              />
              <label className="auth-label" htmlFor="auth-signup-password2">
                Verify password
              </label>
              <input
                id="auth-signup-password2"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                placeholder=" "
                value={passwordConfirm}
                onChange={(ev) => {
                  setPasswordConfirm(ev.target.value);
                  setErrorCode((c) => {
                    if (isConfirmFieldAuthError(c)) {
                      setError(null);
                      return null;
                    }
                    return c;
                  });
                }}
              />
              <AuthFormMessage error={error} errorCode={errorCode} />
              <button type="submit" className="auth-submit auth-submit--accent asset-range-button myinv-range-button">
                Sign up
              </button>
            </form>
            <div className="auth-below-card">
              <Link href="/signin" className="auth-secondary-link asset-range-button myinv-range-button">
                Sign in
              </Link>
            </div>
          </>
        ) : null}
      </AuthPageShell>
    </>
  );
};

export default SignUpPageClient;
