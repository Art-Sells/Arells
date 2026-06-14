'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AuthPageShell from './AuthPageShell';
import AuthCircleLoader from './AuthCircleLoader';
import { useAuthCircleLoader } from './useAuthCircleLoader';
import AuthFormMessage from './AuthFormMessage';
import AuthContentEntrance from './AuthContentEntrance';
import { useUser } from '../../context/UserContext';
import {
  emailVerifiedWelcomeCopy,
  emailVerifiedWelcomePhaseCopy,
} from '../../content/emailVerifiedWelcomeCopy';

/** Shown for every failure on this page (token missing, API error, network). */
const VERIFY_PAGE_ERROR = 'This verification link is invalid or expired.';
/** CSS hook for accent color; message text is always VERIFY_PAGE_ERROR. */
const VERIFY_PAGE_ERROR_CODE = 'VERIFY_LINK';

const VerifiedPageClient: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { refreshAuthSession } = useUser();
  const token = typeof params?.token === 'string' ? params.token : '';
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [revealOpen, setRevealOpen] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const circleLoader = useAuthCircleLoader();
  /** Set true when `?verifyPreview=success` — skips API; remove query when done styling. */
  const verifyPreviewSuccessRef = useRef(false);
  /** `?portfolioPreview=loading` — frozen loading-portfolio UI (no redirect). */
  const portfolioPreviewLoadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('verifyPreview') === 'success') {
      verifyPreviewSuccessRef.current = true;
      setStatus('ok');
    }
    if (params.get('portfolioPreview') === 'loading') {
      portfolioPreviewLoadingRef.current = true;
      verifyPreviewSuccessRef.current = true;
      setStatus('ok');
      setLoadingPortfolio(true);
      circleLoader.show();
    }
  }, [circleLoader.show]);

  useEffect(() => {
    if (status !== 'ok') {
      setRevealOpen(false);
      return;
    }
    setRevealOpen(false);
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => setRevealOpen(true));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [status]);

  useEffect(() => {
    if (verifyPreviewSuccessRef.current) return;
    if (!token) {
      setStatus('err');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });
        await res.json().catch(() => undefined);
        if (cancelled) return;
        if (!res.ok) {
          setStatus('err');
          return;
        }
        await refreshAuthSession();
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('err');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const shellTitle = status === 'ok' ? 'email verified' : status === 'err' ? 'verify email' : '';

  const onViewPortfolio = () => {
    if (loadingPortfolio) return;
    setLoadingPortfolio(true);
    circleLoader.show();
    if (portfolioPreviewLoadingRef.current) return;
    router.push('/my-portfolio');
    router.refresh();
  };

  return (
    <>
    <AuthPageShell title={shellTitle} crossfadeTitle rootClassName="auth-page--verified-email">
      {status === 'ok' ? (
        <AuthContentEntrance>
          <div className="auth-verify-sent auth-verify-sent--verified-success">
            <div className={`auth-success-reveal auth-success-reveal--verified-full${revealOpen ? ' is-open' : ''}`}>
              <div className="auth-success-reveal-inner">
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
                        {loadingPortfolio ? 'Loading…' : 'View Portfolio'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AuthContentEntrance>
      ) : status === 'err' ? (
        <AuthContentEntrance>
          <div className="auth-verify-sent auth-verify-sent--verify-error">
            <AuthFormMessage error={VERIFY_PAGE_ERROR} errorCode={VERIFY_PAGE_ERROR_CODE} />
            <Link
              href="/signin"
              className="auth-secondary-link auth-submit--accent asset-range-button myinv-range-button auth-verify-error-cta"
            >
              Sign in
            </Link>
          </div>
        </AuthContentEntrance>
      ) : null}
    </AuthPageShell>
    <AuthCircleLoader mounted={circleLoader.mounted} visible={circleLoader.visible} />
    </>
  );
};

export default VerifiedPageClient;
