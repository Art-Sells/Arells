'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AuthPageShell from './AuthPageShell';

const VerifiedPageClient: React.FC = () => {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [loaderFadeOut, setLoaderFadeOut] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('err');
      setMessage('Invalid verification link.');
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
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoaderFadeOut(true);
          window.setTimeout(() => {
            setStatus('err');
            setMessage(typeof data.error === 'string' ? data.error : 'Verification failed.');
          }, 2000);
          return;
        }
        setLoaderFadeOut(true);
        window.setTimeout(() => {
          if (!cancelled) setStatus('ok');
        }, 2000);
      } catch {
        if (!cancelled) {
          setLoaderFadeOut(true);
          window.setTimeout(() => {
            setStatus('err');
            setMessage('Something went wrong.');
          }, 2000);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      {status === 'idle' && (
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
      <AuthPageShell title="verify email">
        {status === 'ok' ? (
          <div className="auth-verified-block myinv-accent-border">
            <p className="auth-verified-title">Email Verified</p>
            <Link href="/my-investments" className="auth-submit asset-range-button myinv-range-button">
              View Portfolio
            </Link>
          </div>
        ) : status === 'err' ? (
          <div className="auth-verify-sent">
            <p className="auth-message auth-message--error" role="alert">
              {message || 'Verification failed.'}
            </p>
            <Link href="/signin" className="auth-submit asset-range-button myinv-range-button">
              Back to sign in
            </Link>
          </div>
        ) : null}
      </AuthPageShell>
    </>
  );
};

export default VerifiedPageClient;
