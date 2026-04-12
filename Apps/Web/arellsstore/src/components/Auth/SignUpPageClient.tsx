'use client';

import React, { useEffect, useState } from 'react';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import AuthSuccessArellsMark from './AuthSuccessArellsMark';
import { EMAIL_RE, normalizeEmail } from '../../lib/auth/normalize';
import {
  isConfirmFieldAuthError,
  isEmailRelatedAuthError,
  isPasswordFieldAuthError,
} from '../../lib/auth/authFieldErrors';
import { validateAuthPassword } from '../../lib/auth/validateAuthPassword';
import { AUTH_COLLAPSE_SCROLL_TOP_MS, scrollDocumentToTopOverMs } from '../../lib/client/documentScroll';

const COLLAPSE_MS = 1500;

const SignUpPageClient: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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
    if (phase !== 'exiting') return;
    return scrollDocumentToTopOverMs(AUTH_COLLAPSE_SCROLL_TOP_MS);
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
    if (!password) {
      setError('Please enter a password.');
      setErrorCode('REQUIRED_PASSWORD');
      return;
    }
    const pwCheck = validateAuthPassword(password);
    if (!pwCheck.ok) {
      setError(pwCheck.error);
      setErrorCode(pwCheck.code);
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
      setSentTo(typeof data.email === 'string' ? data.email : email);
      setPhase('exiting');
    } catch {
      setPhase('form');
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formDisabled = phase === 'exiting';
  const belowMark =
    phase === 'exiting' || phase === 'sent' ? <AuthSuccessArellsMark /> : undefined;

  return (
    <AuthPageShell title="sign up" belowCard={belowMark}>
      {phase === 'sent' ? (
        <div className={`auth-success-reveal${revealSuccess ? ' is-open' : ''}`}>
          <div className="auth-success-reveal-inner">
            <div className="auth-verify-sent">
              <p className="auth-verify-sent-title auth-verify-sent-title--black auth-verify-sent-title--signup-email-sent">
                Verification email sent
              </p>
              <p className="auth-verify-sent-email-row">
                <span className="auth-verify-sent-email-accent">{sentTo}</span>
              </p>
              <div className="auth-verify-sent-copy">
                <p className="auth-verify-sent-sub auth-verify-sent-sub--forgot-sent">
                  Verify your email before continuing. Check your{' '}
                  <span className="auth-verify-sent-spam-emphasis">spam/junk</span> in case your inbox doesn&apos;t
                  receive it.
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
                disabled={formDisabled}
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
                disabled={formDisabled}
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
              <label
                className="auth-label auth-label--signup-verify-password"
                htmlFor="auth-signup-password2"
              >
                Confirm Password
              </label>
              <input
                id="auth-signup-password2"
                className="auth-input auth-input--signup-verify-password"
                type="password"
                autoComplete="new-password"
                placeholder=" "
                value={passwordConfirm}
                disabled={formDisabled}
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
              <button
                type="submit"
                className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button"
                disabled={submitting || formDisabled}
              >
                {submitting ? 'Signing up…' : 'Sign up'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </AuthPageShell>
  );
};

export default SignUpPageClient;
