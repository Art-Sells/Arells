'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import { isConfirmFieldAuthError, isPasswordFieldAuthError } from '../../lib/auth/authFieldErrors';

const ResetPasswordPageClient: React.FC = () => {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenEmail, setTokenEmail] = useState('');
  const [loaderFadeOut, setLoaderFadeOut] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      setTokenError('Invalid reset link.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoaderFadeOut(true);
          window.setTimeout(() => {
            if (!cancelled) {
              setTokenStatus('invalid');
              setTokenError(typeof data.error === 'string' ? data.error : 'Invalid reset link.');
            }
          }, 2000);
          return;
        }
        setLoaderFadeOut(true);
        window.setTimeout(() => {
          if (!cancelled) {
            setTokenEmail(typeof data.email === 'string' ? data.email : '');
            setTokenStatus('valid');
          }
        }, 2000);
      } catch {
        if (!cancelled) {
          setLoaderFadeOut(true);
          window.setTimeout(() => {
            setTokenStatus('invalid');
            setTokenError('Something went wrong.');
          }, 2000);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
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
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password, passwordConfirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Reset failed.');
        setErrorCode(typeof data.code === 'string' ? data.code : null);
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {tokenStatus === 'loading' && (
        <div className={`asset-loader-overlay myinv-loader-overlay${loaderFadeOut ? ' asset-loader-overlay-fade' : ''}`}>
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
      <AuthPageShell title="reset password">
        {tokenStatus === 'invalid' ? (
          <div className="auth-verify-sent">
            <AuthFormMessage error={tokenError || 'Invalid reset link.'} errorCode="BAD_TOKEN" />
            <Link href="/forgot-password" className="auth-submit asset-range-button myinv-range-button">
              Request a new link
            </Link>
          </div>
        ) : tokenStatus === 'valid' && done ? (
          <div className="auth-verify-sent">
            <p className="auth-verify-sent-title">Password reset successfully.</p>
            <Link href="/signin" className="auth-submit asset-range-button myinv-range-button">
              Sign in
            </Link>
          </div>
        ) : tokenStatus === 'valid' ? (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <p className="auth-verify-sent-title" style={{ textAlign: 'center', marginBottom: 12 }}>
              {tokenEmail}
            </p>
            <label className="auth-label" htmlFor="auth-reset-password">
              Password
            </label>
            <input
              id="auth-reset-password"
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
            <label className="auth-label" htmlFor="auth-reset-password2">
              Verify password
            </label>
            <input
              id="auth-reset-password2"
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
            <button type="submit" className="auth-submit asset-range-button myinv-range-button" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset'}
            </button>
          </form>
        ) : null}
      </AuthPageShell>
    </>
  );
};

export default ResetPasswordPageClient;
