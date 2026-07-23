'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import AuthSuccessArellsMark from './AuthSuccessArellsMark';
import AuthOtpCodeForm from './AuthOtpCodeForm';
import { EMAIL_RE, normalizeEmail } from '../../lib/auth/normalize';
import {
  isConfirmFieldAuthError,
  isEmailRelatedAuthError,
  isPasswordFieldAuthError,
} from '../../lib/auth/authFieldErrors';
import { validateAuthPassword } from '../../lib/auth/validateAuthPassword';
import { AUTH_COLLAPSE_SCROLL_TOP_MS, scrollDocumentToTopOverMs } from '../../lib/client/documentScroll';

const COLLAPSE_MS = 1500;

const ForgotPasswordPageClient: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<'form' | 'exiting' | 'sent' | 'reset' | 'done'>('form');
  const [sentTo, setSentTo] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [revealSuccess, setRevealSuccess] = useState(false);
  const [otpExiting, setOtpExiting] = useState(false);
  const [resetExiting, setResetExiting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('forgotPreview') === 'sent') {
      setSentTo('preview@arells.app');
      setPhase('sent');
    }
  }, []);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const t = window.setTimeout(() => setPhase('sent'), COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!otpExiting) return;
    const t = window.setTimeout(() => {
      setOtpExiting(false);
      setPhase('reset');
    }, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [otpExiting]);

  useEffect(() => {
    if (!resetExiting) return;
    const t = window.setTimeout(() => {
      setResetExiting(false);
      setPhase('done');
    }, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [resetExiting]);

  useEffect(() => {
    if (phase !== 'exiting' && !otpExiting && !resetExiting) return;
    return scrollDocumentToTopOverMs(AUTH_COLLAPSE_SCROLL_TOP_MS);
  }, [phase, otpExiting, resetExiting]);

  useEffect(() => {
    if (phase !== 'sent' && phase !== 'reset' && phase !== 'done') {
      setRevealSuccess(false);
      return;
    }
    if (otpExiting || resetExiting) return;
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setRevealSuccess(true));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [phase, otpExiting, resetExiting]);

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
        body: JSON.stringify({ email: em }),
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

  const onSubmitCode = async (code: string) => {
    setOtpSubmitting(true);
    try {
      const res = await fetch('/api/auth/confirm-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: sentTo, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          error: typeof data.error === 'string' ? data.error : 'Invalid or expired code.',
          code: typeof data.code === 'string' ? data.code : 'BAD_CODE',
        };
      }
      if (typeof data.resetToken !== 'string' || !data.resetToken) {
        return { error: 'Something went wrong. Try again.', code: 'NO_TOKEN' };
      }
      setResetToken(data.resetToken);
      setRevealSuccess(false);
      setOtpExiting(true);
    } catch {
      return { error: 'Something went wrong. Try again.', code: 'NETWORK' };
    } finally {
      setOtpSubmitting(false);
    }
  };

  const onResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
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
    setResetSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: resetToken, password, passwordConfirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Reset failed.');
        setErrorCode(typeof data.code === 'string' ? data.code : null);
        return;
      }
      setRevealSuccess(false);
      setResetExiting(true);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const belowMark =
    phase === 'exiting' ||
    phase === 'sent' ||
    phase === 'reset' ||
    phase === 'done' ||
    otpExiting ||
    resetExiting ? (
      <AuthSuccessArellsMark />
    ) : undefined;

  const shellTitle =
    phase === 'done' || resetExiting
      ? 'reset password'
      : phase === 'reset'
        ? 'reset password'
        : phase === 'sent' || otpExiting
          ? 'verify code'
          : 'forgot password';

  return (
    <AuthPageShell title={shellTitle} belowCard={belowMark}>
      {phase === 'done' ? (
        <div className={`auth-success-reveal${revealSuccess ? ' is-open' : ''}`}>
          <div className="auth-success-reveal-inner">
            <div className="auth-verify-sent auth-verify-sent--verified-success">
              <p className="auth-verify-sent-title auth-verify-sent-title--black auth-verify-sent-title--signup-email-sent">
                Completed
              </p>
              <Link
                href="/signin"
                className="auth-secondary-link auth-submit--accent asset-range-button myinv-range-button auth-verify-success-cta"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {phase === 'reset' || resetExiting ? (
        <div
          className={`auth-form-collapse-wrap${resetExiting ? ' is-collapsing' : ''}`}
        >
          <div
            className={`auth-form-collapse-inner${resetExiting ? ' auth-form-collapse-inner--inactive' : ''}`}
          >
            <div className={`auth-success-reveal${revealSuccess || resetExiting ? ' is-open' : ''}`}>
              <div className="auth-success-reveal-inner">
                <form className="auth-form" onSubmit={onResetSubmit} noValidate>
                  <label className="auth-label" htmlFor="auth-forgot-reset-password">
                    New Password
                  </label>
                  <input
                    id="auth-forgot-reset-password"
                    className="auth-input"
                    type="password"
                    autoComplete="new-password"
                    placeholder=" "
                    value={password}
                    disabled={resetSubmitting || resetExiting}
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
                  <label className="auth-label" htmlFor="auth-forgot-reset-password2">
                    Confirm Password
                  </label>
                  <input
                    id="auth-forgot-reset-password2"
                    className="auth-input"
                    type="password"
                    autoComplete="new-password"
                    placeholder=" "
                    value={passwordConfirm}
                    disabled={resetSubmitting || resetExiting}
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
                    className="auth-submit auth-submit--accent asset-range-button myinv-range-button"
                    disabled={resetSubmitting || resetExiting}
                  >
                    {resetSubmitting ? 'Saving…' : 'Reset Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {phase === 'sent' || otpExiting ? (
        <div className={`auth-form-collapse-wrap${otpExiting ? ' is-collapsing' : ''}`}>
          <div
            className={`auth-form-collapse-inner${otpExiting ? ' auth-form-collapse-inner--inactive' : ''}`}
          >
            <div className={`auth-success-reveal${revealSuccess || otpExiting ? ' is-open' : ''}`}>
              <div className="auth-success-reveal-inner">
                <div className="auth-verify-sent">
                  <p className="auth-verify-sent-title auth-verify-sent-title--black">Verification Code Sent</p>
                  <p className="auth-verify-sent-email-row">
                    <span className="auth-verify-sent-email-accent">{sentTo}</span>
                  </p>
                  <AuthOtpCodeForm
                    email={sentTo}
                    resendUrl="/api/auth/resend-password-reset"
                    onSubmitCode={onSubmitCode}
                    submitting={otpSubmitting || otpExiting}
                  />
                </div>
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
