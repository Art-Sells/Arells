'use client';

import React, { useEffect, useRef, useState } from 'react';
import { readReferralCodeFromDocumentCookie } from '../../lib/auth/referralClient';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: string;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: string;
      size?: string;
      text?: string;
      shape?: string;
      width?: number;
      logo_alignment?: string;
    }
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

let gsiLoadPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;
  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google script failed')), {
        once: true,
      });
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google script failed'));
    document.head.appendChild(script);
  });
  return gsiLoadPromise;
}

export type AuthGoogleSectionProps = {
  /** Sign-in vs sign-up Google button label. */
  mode: 'signin' | 'signup';
  disabled?: boolean;
  /** Called when Google returns a credential (before API). */
  onStart?: () => void;
  /** Called after cookie session is set; parent collapses then routes. */
  onSuccess: () => void | Promise<void>;
  onError?: (message: string) => void;
};

/**
 * Google Identity button above the primary auth submit.
 * Same API for /signin and /signup: create-or-link + session cookie.
 */
export default function AuthGoogleSection({
  mode,
  disabled = false,
  onStart,
  onSuccess,
  onError,
}: AuthGoogleSectionProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const disabledRef = useRef(disabled);
  const onStartRef = useRef(onStart);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  disabledRef.current = disabled;
  onStartRef.current = onStart;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const exchangeCredential = async (credential: string) => {
      if (busyRef.current || disabledRef.current) return;
      busyRef.current = true;
      setBusy(true);
      onStartRef.current?.();
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            credential,
            referralCode: readReferralCodeFromDocumentCookie(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          onErrorRef.current?.(
            typeof data.error === 'string' ? data.error : 'Google sign-in failed.'
          );
          busyRef.current = false;
          setBusy(false);
          return;
        }
        await onSuccessRef.current();
      } catch {
        onErrorRef.current?.('Something went wrong. Try again.');
        busyRef.current = false;
        setBusy(false);
      }
    };

    void (async () => {
      try {
        await loadGsi();
        if (cancelled || !buttonHostRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential =
              typeof response?.credential === 'string' ? response.credential.trim() : '';
            if (!credential) {
              onErrorRef.current?.('Google sign-in was cancelled.');
              return;
            }
            void exchangeCredential(credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: mode === 'signup' ? 'signup' : 'signin',
        });
        const width = Math.min(
          400,
          Math.max(240, Math.floor(buttonHostRef.current.getBoundingClientRect().width || 320))
        );
        buttonHostRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonHostRef.current, {
          theme: 'outline',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          width,
          logo_alignment: 'left',
        });
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) onErrorRef.current?.('Google sign-in is unavailable.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  if (!clientId) return null;

  return (
    <div
      className={`auth-google-section${busy || disabled ? ' is-busy' : ''}${
        ready ? ' is-ready' : ''
      }`}
      aria-busy={busy || undefined}
    >
      <div className="auth-google-divider" aria-hidden="true">
        <span className="auth-google-divider-line" />
        <span className="auth-google-divider-text">or</span>
        <span className="auth-google-divider-line" />
      </div>
      <div ref={buttonHostRef} className="auth-google-button-host" />
    </div>
  );
}
