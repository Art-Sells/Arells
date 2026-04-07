'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import AuthContentEntrance from './AuthContentEntrance';
import { isConfirmFieldAuthError, isPasswordFieldAuthError } from '../../lib/auth/authFieldErrors';
import { validateAuthPassword } from '../../lib/auth/validateAuthPassword';

const COLLAPSE_MS = 1500;

const ResetPasswordPageClient: React.FC = () => {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenEmail, setTokenEmail] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [successPhase, setSuccessPhase] = useState<'form' | 'exiting' | 'sent'>('form');
  const [revealSuccess, setRevealSuccess] = useState(false);
  const [resetFieldsRevealOpen, setResetFieldsRevealOpen] = useState(false);
  const skipTokenFetchRef = useRef(false);
  const resetPreviewFlowRef = useRef(false);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !token) return;
    const q = new URLSearchParams(window.location.search).get('resetPreview');
    if (q === 'success') {
      skipTokenFetchRef.current = true;
      setTokenStatus('valid');
      setTokenEmail('preview@arells.app');
      setSuccessPhase('sent');
      return;
    }
    if (q === 'flow') {
      skipTokenFetchRef.current = true;
      resetPreviewFlowRef.current = true;
      setTokenStatus('valid');
      setTokenEmail('preview@arells.app');
    }
  }, [token]);

  useEffect(() => {
    if (successPhase !== 'exiting') return;
    const t = window.setTimeout(() => setSuccessPhase('sent'), COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [successPhase]);

  useEffect(() => {
    if (successPhase !== 'sent') {
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
  }, [successPhase]);

  useEffect(() => {
    if (skipTokenFetchRef.current) return;
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
          if (!cancelled) {
            setTokenStatus('invalid');
            setTokenError(typeof data.error === 'string' ? data.error : 'Invalid reset link.');
          }
          return;
        }
        if (!cancelled) {
          setTokenEmail(typeof data.email === 'string' ? data.email : '');
          setTokenStatus('valid');
        }
      } catch {
        if (!cancelled) {
          setTokenStatus('invalid');
          setTokenError('Something went wrong.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  /**
   * Let one paint at grid 0fr before adding .is-open so `grid-template-rows` actually transitions.
   * Preview / skip-fetch opens immediately so the card is not stuck collapsed.
   */
  useLayoutEffect(() => {
    if (tokenStatus !== 'valid') {
      setResetFieldsRevealOpen(false);
      return;
    }
    if (skipTokenFetchRef.current) {
      setResetFieldsRevealOpen(true);
      return;
    }
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setResetFieldsRevealOpen(true));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [tokenStatus]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenStatus === 'loading') return;
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
    if (resetPreviewFlowRef.current) {
      setSubmitting(true);
      window.setTimeout(() => {
        setSubmitting(false);
        setSuccessPhase('exiting');
      }, 400);
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
      setSuccessPhase('exiting');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formDisabled = successPhase === 'exiting';
  const tokenLoading = tokenStatus === 'loading';
  const fieldsLocked = tokenLoading || submitting || formDisabled;
  return (
    <AuthPageShell title="reset password">
      {tokenStatus === 'invalid' ? (
        <AuthContentEntrance>
          <div className="auth-verify-sent">
            <AuthFormMessage error={tokenError || 'Invalid reset link.'} errorCode="BAD_TOKEN" />
            <Link href="/forgot-password" className="auth-submit asset-range-button myinv-range-button">
              Request a new link
            </Link>
          </div>
        </AuthContentEntrance>
      ) : tokenStatus === 'valid' && successPhase === 'sent' ? (
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
      ) : (
        <div className={`auth-form-collapse-wrap${successPhase === 'exiting' ? ' is-collapsing' : ''}`}>
          <div
            className={`auth-form-collapse-inner${
              successPhase === 'exiting' ? ' auth-form-collapse-inner--inactive' : ''
            }`}
          >
            <form
              className="auth-form"
              onSubmit={onSubmit}
              noValidate
              aria-busy={tokenLoading}
            >
              <div
                className={`auth-reset-token-email${
                  tokenLoading || !resetFieldsRevealOpen
                    ? ' auth-reset-token-email--pending'
                    : ' auth-reset-token-email--revealed'
                }`}
              >
                <p className="auth-verify-sent-email-row">
                  <span className="auth-verify-sent-email-accent">
                    {tokenLoading || !resetFieldsRevealOpen ? '' : tokenEmail}
                  </span>
                </p>
              </div>
              <div
                className={`auth-reset-fields-reveal${resetFieldsRevealOpen ? ' is-open' : ''}`}
              >
                <div className="auth-reset-fields-reveal-inner">
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
                    disabled={fieldsLocked}
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
                    Confirm Password
                  </label>
                  <input
                    id="auth-reset-password2"
                    className="auth-input auth-input--reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder=" "
                    value={passwordConfirm}
                    disabled={fieldsLocked}
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
                    className="auth-submit asset-range-button myinv-range-button"
                    disabled={fieldsLocked}
                  >
                    {submitting ? 'Resetting…' : 'Reset'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthPageShell>
  );
};

export default ResetPasswordPageClient;
