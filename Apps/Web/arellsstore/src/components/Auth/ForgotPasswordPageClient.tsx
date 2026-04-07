'use client';

import React, { useEffect, useState } from 'react';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import AuthSuccessArellsMark from './AuthSuccessArellsMark';
import { EMAIL_RE, normalizeEmail } from '../../lib/auth/normalize';
import { isEmailRelatedAuthError } from '../../lib/auth/authFieldErrors';

const COLLAPSE_MS = 1500;

const ForgotPasswordPageClient: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<'form' | 'exiting' | 'sent'>('form');
  const [sentTo, setSentTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [revealSuccess, setRevealSuccess] = useState(false);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const t = window.setTimeout(() => setPhase('sent'), COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'sent') {
      setRevealSuccess(false);
      return;
    }
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setRevealSuccess(true));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [phase]);

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
    setSubmitting(true);
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
      setSentTo(em);
      setPhase('exiting');
    } catch {
      setPhase('form');
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const belowMark =
    phase === 'exiting' || phase === 'sent' ? <AuthSuccessArellsMark /> : undefined;

  return (
    <AuthPageShell title="forgot password" belowCard={belowMark}>
      {phase === 'sent' ? (
        <div className={`auth-success-reveal${revealSuccess ? ' is-open' : ''}`}>
          <div className="auth-success-reveal-inner">
            <div className="auth-verify-sent">
              <p className="auth-verify-sent-title auth-verify-sent-title--black">Password reset sent</p>
              <p className="auth-verify-sent-email-row">
                <span className="auth-verify-sent-email-accent">{sentTo}</span>
              </p>
              <div className="auth-verify-sent-copy auth-verify-sent-copy--forgot-password">
                <p className="auth-verify-sent-sub auth-verify-sent-sub--forgot-sent">
                  If we have an account for your email, you will receive it shortly. Check your{' '}
                  <span className="auth-verify-sent-spam-emphasis">spam/junk</span> in case your inbox
                  doesn&apos;t receive it.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {phase === 'form' || phase === 'exiting' ? (
        <div className={`auth-form-collapse-wrap${phase === 'exiting' ? ' is-collapsing' : ''}`}>
          <div
            className={`auth-form-collapse-inner${phase === 'exiting' ? ' auth-form-collapse-inner--inactive' : ''}`}
          >
            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <label className="auth-label" htmlFor="auth-forgot-email">
                Email
              </label>
              <input
                id="auth-forgot-email"
                className="auth-input auth-input--forgot-email"
                type="email"
                autoComplete="email"
                placeholder=" "
                value={email}
                disabled={phase === 'exiting'}
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
              <button
                type="submit"
                className="auth-submit asset-range-button myinv-range-button"
                disabled={submitting || phase === 'exiting'}
              >
                {submitting ? 'Sending…' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </AuthPageShell>
  );
};

export default ForgotPasswordPageClient;
