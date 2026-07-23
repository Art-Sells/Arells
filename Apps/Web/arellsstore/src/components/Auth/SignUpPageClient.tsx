'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import AuthSuccessArellsMark from './AuthSuccessArellsMark';
import AuthOtpCodeForm from './AuthOtpCodeForm';
import AuthCircleLoader from './AuthCircleLoader';
import { useAuthCircleLoader } from './useAuthCircleLoader';
import { useUser } from '../../context/UserContext';
import { EMAIL_RE, normalizeEmail } from '../../lib/auth/normalize';
import {
  isConfirmFieldAuthError,
  isEmailRelatedAuthError,
  isPasswordFieldAuthError,
} from '../../lib/auth/authFieldErrors';
import { validateAuthPassword } from '../../lib/auth/validateAuthPassword';
import { readReferralCodeFromDocumentCookie } from '../../lib/auth/referralClient';
import { AUTH_COLLAPSE_SCROLL_TOP_MS, scrollDocumentToTopOverMs } from '../../lib/client/documentScroll';
import {
  emailVerifiedWelcomeCopy,
  emailVerifiedWelcomePhaseCopy,
} from '../../content/emailVerifiedWelcomeCopy';

const COLLAPSE_MS = 1500;

const SignUpPageClient: React.FC = () => {
  const router = useRouter();
  const { refreshAuthSession } = useUser();
  const circleLoader = useAuthCircleLoader();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<'form' | 'exiting' | 'sent' | 'verified'>('form');
  const [sentTo, setSentTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [revealSuccess, setRevealSuccess] = useState(false);
  const [otpExiting, setOtpExiting] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('signupPreview') === 'sent') {
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
      setPhase('verified');
    }, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [otpExiting]);

  useEffect(() => {
    if (phase !== 'exiting' && !otpExiting) return;
    return scrollDocumentToTopOverMs(AUTH_COLLAPSE_SCROLL_TOP_MS);
  }, [phase, otpExiting]);

  useEffect(() => {
    if (phase !== 'sent' && phase !== 'verified') {
      setRevealSuccess(false);
      return;
    }
    if (otpExiting) return;
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setRevealSuccess(true));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [phase, otpExiting]);

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
          referralCode: readReferralCodeFromDocumentCookie(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase('form');
        setError(typeof data.error === 'string' ? data.error : 'Sign up failed.');
        setErrorCode(typeof data.code === 'string' ? data.code : null);
        return;
      }
      setSentTo(typeof data.email === 'string' ? data.email : em);
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
      const res = await fetch('/api/auth/verify', {
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
      await refreshAuthSession();
      setRevealSuccess(false);
      setOtpExiting(true);
    } catch {
      return { error: 'Something went wrong. Try again.', code: 'NETWORK' };
    } finally {
      setOtpSubmitting(false);
    }
  };

  const onViewPortfolio = () => {
    if (loadingPortfolio) return;
    setLoadingPortfolio(true);
    circleLoader.show();
    router.push('/my-portfolio');
    router.refresh();
  };

  const formDisabled = phase === 'exiting';
  const belowMark =
    phase === 'exiting' || phase === 'sent' || phase === 'verified' || otpExiting ? (
      <AuthSuccessArellsMark />
    ) : undefined;

  const shellTitle =
    phase === 'verified'
      ? 'email verified'
      : phase === 'sent' || otpExiting
        ? 'verify email'
        : 'sign up';

  return (
    <>
      <AuthPageShell
        title={shellTitle}
        belowCard={belowMark}
        rootClassName={phase === 'verified' ? 'auth-page--verified-email' : undefined}
      >
        {phase === 'verified' ? (
          <div className={`auth-success-reveal auth-success-reveal--verified-full${revealSuccess ? ' is-open' : ''}`}>
            <div className="auth-success-reveal-inner">
              <div className="auth-verify-sent auth-verify-sent--verified-success">
                <div className="auth-verified-welcome" aria-live="polite">
                  <p className="auth-verified-welcome-headline">{emailVerifiedWelcomeCopy.headline}</p>
                  <p className="auth-verified-welcome-paragraph">{emailVerifiedWelcomeCopy.paragraphs[0]}</p>
                  <div className="auth-verified-welcome-phases auth-verified-welcome-phases--stacked myinv-accent-border">
                    <div className="auth-verified-welcome-phase-intro-lines">
                      <p className="auth-verified-welcome-phase-line auth-verified-welcome-phase-line--stack-muted">
                        {emailVerifiedWelcomePhaseCopy.missionPhaseIntroLines.line1}
                      </p>
                      <p className="auth-verified-welcome-phase-line auth-verified-welcome-phase-line--stack-accent">
                        {emailVerifiedWelcomePhaseCopy.missionPhaseIntroLines.line2}
                      </p>
                      <p className="auth-verified-welcome-phase-line auth-verified-welcome-phase-line--stack-muted">
                        {emailVerifiedWelcomePhaseCopy.missionPhaseIntroLines.line3}
                      </p>
                    </div>
                    <div className="auth-verified-phase-section myinv-accent-border">
                      <p className="auth-verified-welcome-phase-line auth-verified-welcome-phase-line--portfolio-cta">
                        {emailVerifiedWelcomePhaseCopy.portfolioBenefitLine}
                      </p>
                      <button
                        type="button"
                        onClick={onViewPortfolio}
                        disabled={loadingPortfolio}
                        className="auth-secondary-link auth-submit--accent asset-range-button myinv-range-button auth-verify-success-cta"
                      >
                        {loadingPortfolio ? 'Loading Portfolio' : 'View Portfolio'}
                      </button>
                    </div>
                  </div>
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
                    <p className="auth-verify-sent-title auth-verify-sent-title--black auth-verify-sent-title--signup-email-sent">
                      Verification Code Sent
                    </p>
                    <p className="auth-verify-sent-email-row">
                      <span className="auth-verify-sent-email-accent">{sentTo}</span>
                    </p>
                    <AuthOtpCodeForm
                      email={sentTo}
                      resendUrl="/api/auth/resend-verification"
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
      <AuthCircleLoader mounted={circleLoader.mounted} visible={circleLoader.visible} />
    </>
  );
};

export default SignUpPageClient;
