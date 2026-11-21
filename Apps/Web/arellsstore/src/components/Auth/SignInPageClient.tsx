'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthPageShell from './AuthPageShell';
import AuthFormMessage from './AuthFormMessage';
import AuthCircleLoader from './AuthCircleLoader';
import AuthGoogleSection from './AuthGoogleSection';
import AuthSuccessArellsMark from './AuthSuccessArellsMark';
import { useAuthCircleLoader } from './useAuthCircleLoader';
import { useAuthCredentialsRevealHeight } from './useAuthCredentialsRevealHeight';
import { useUser } from '../../context/UserContext';
import { EMAIL_RE, normalizeEmail } from '../../lib/auth/normalize';
import { isEmailRelatedAuthError, isPasswordFieldAuthError } from '../../lib/auth/authFieldErrors';
import { AUTH_COLLAPSE_SCROLL_TOP_MS, scrollDocumentToTopOverMs } from '../../lib/client/documentScroll';

/** Fallback when POST /api/auth/login fails without a usable API message. */
const SIGN_IN_FAILED_MESSAGE = 'Wrong email/password combo.';
const SIGN_IN_FAILED_CODE = 'SIGN_IN_COMBO';
const COLLAPSE_MS = 1500;

function cssKeyframeName(a: Animation): string {
  return (a as CSSAnimation).animationName ?? '';
}

/** Anchor + var(--myinv-accent-color) often stays black; keyframed color works. Match :root phase after SPA navigations. */
function syncForgotLinkAccentPhase(linkEl: HTMLElement) {
  const rootCycle = document.documentElement
    .getAnimations?.()
    .find((a) => cssKeyframeName(a) === 'myInvAccentCycle');
  const linkCycle = linkEl.getAnimations?.().find((a) => cssKeyframeName(a) === 'authForgotLinkAccentCycle');
  if (!rootCycle || !linkCycle) return;
  const t = rootCycle.currentTime;
  if (t == null) return;
  try {
    linkCycle.currentTime = t;
  } catch {
    /* ignore */
  }
}

const SignInPageClient: React.FC = () => {
  const router = useRouter();
  const { refreshAuthSession } = useUser();
  const forgotLinkRef = useRef<HTMLAnchorElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Email/password fields hidden until Sign in is clicked. */
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const credentialsReveal = useAuthCredentialsRevealHeight(credentialsOpen);
  const [phase, setPhase] = useState<'form' | 'exiting'>('form');
  const circleLoader = useAuthCircleLoader();
  /** `?signInPreview=loading` — frozen signing-in UI for styling (no API, no redirect). */
  const signInPreviewLoadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('signInPreview') === 'loading') {
      signInPreviewLoadingRef.current = true;
      setCredentialsOpen(true);
      setSubmitting(true);
      circleLoader.show();
    }
  }, [circleLoader.show]);

  useLayoutEffect(() => {
    if (!credentialsOpen) return;
    const el = forgotLinkRef.current;
    if (!el) return;
    const run = () => syncForgotLinkAccentPhase(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        run();
        window.setTimeout(run, 0);
      });
    });
  }, [credentialsOpen]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    return scrollDocumentToTopOverMs(AUTH_COLLAPSE_SCROLL_TOP_MS);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const t = window.setTimeout(() => {
      router.push('/bitcoin');
      router.refresh();
    }, COLLAPSE_MS);
    return () => window.clearTimeout(t);
  }, [phase, router]);

  const finishSignIn = async () => {
    await refreshAuthSession();
    // Keep circle loader up through height-up + redirect (do not hide on success).
    setPhase('exiting');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signInPreviewLoadingRef.current) return;
    if (phase === 'exiting') return;
    if (!credentialsOpen) {
      setCredentialsOpen(true);
      return;
    }
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
      setError('Please enter your password.');
      setErrorCode('REQUIRED_PASSWORD');
      return;
    }
    setSubmitting(true);
    circleLoader.show();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: em, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code =
          typeof data.code === 'string' && data.code.length > 0 ? data.code : SIGN_IN_FAILED_CODE;
        const message =
          typeof data.error === 'string' && data.error.length > 0 ? data.error : SIGN_IN_FAILED_MESSAGE;
        setError(message);
        setErrorCode(code);
        setSubmitting(false);
        circleLoader.hide();
        return;
      }
      await finishSignIn();
    } catch {
      setError('Something went wrong. Try again.');
      setSubmitting(false);
      circleLoader.hide();
    }
  };

  const formDisabled = phase === 'exiting' || submitting;
  const signingIn = submitting || phase === 'exiting';
  const belowCard =
    phase === 'exiting' ? (
      <AuthSuccessArellsMark />
    ) : (
      <Link
        href="/signup"
        className="auth-secondary-link auth-submit asset-range-button myinv-range-button"
      >
        Sign up
      </Link>
    );

  return (
    <>
    <AuthPageShell title="sign in" belowCard={belowCard}>
      <div className={`auth-form-collapse-wrap${phase === 'exiting' ? ' is-collapsing' : ''}`}>
        <div
          className={`auth-form-collapse-inner${phase === 'exiting' ? ' auth-form-collapse-inner--inactive' : ''}`}
        >
          <div className="auth-form auth-form--gate">
            <AuthGoogleSection
              mode="signin"
              disabled={formDisabled}
              onStart={() => {
                setSubmitting(true);
                setError(null);
                setErrorCode(null);
                circleLoader.show();
              }}
              onSuccess={finishSignIn}
              onError={(message) => {
                setError(message);
                setErrorCode('GOOGLE_FAILED');
                setSubmitting(false);
                circleLoader.hide();
              }}
            />

            <form className="auth-credentials-form" onSubmit={onSubmit} noValidate>
              <div
                className={`auth-success-reveal auth-credentials-reveal${
                  credentialsOpen ? ' is-open' : ''
                }`}
                style={credentialsReveal.style}
              >
                <div ref={credentialsReveal.innerRef} className="auth-success-reveal-inner">
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
                    disabled={formDisabled || !credentialsOpen}
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
                    disabled={formDisabled || !credentialsOpen}
                    onChange={(ev) => {
                      setPassword(ev.target.value);
                      setErrorCode((c) => {
                        if (isPasswordFieldAuthError(c) || c === 'USE_GOOGLE') {
                          setError(null);
                          return null;
                        }
                        return c;
                      });
                    }}
                  />
                  <Link ref={forgotLinkRef} href="/forgot-password" className="auth-forgot-link">
                    Forgot Password
                  </Link>
                </div>
              </div>

              <AuthFormMessage error={error} errorCode={errorCode} />

              <button
                type="submit"
                className="auth-submit asset-range-button myinv-range-button"
                disabled={formDisabled}
              >
                {signingIn ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthPageShell>
    <AuthCircleLoader mounted={circleLoader.mounted} visible={circleLoader.visible} />
    </>
  );
};

export default SignInPageClient;
