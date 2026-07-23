'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import AuthFormMessage from './AuthFormMessage';

/** Matches server OTP_TTL_MS (5 minutes). */
const OTP_COOLDOWN_MS = 5 * 60 * 1000;

type AuthOtpCodeFormProps = {
  email: string;
  resendUrl: string;
  onSubmitCode: (code: string) => Promise<{ error?: string; code?: string } | void>;
  submitting?: boolean;
};

const BOX_COUNT = 6;

const AuthOtpCodeForm: React.FC<AuthOtpCodeFormProps> = ({
  email,
  resendUrl,
  onSubmitCode,
  submitting = false,
}) => {
  const [digits, setDigits] = useState<string[]>(() => Array(BOX_COUNT).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const codeSentLocked = nowMs < resendCooldownUntil;

  useEffect(() => {
    if (!codeSentLocked) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [codeSentLocked]);

  const codeValue = digits.join('');

  const focusBox = (index: number) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const applyDigits = useCallback((next: string[]) => {
    setDigits(next);
    setError(null);
    setErrorCode(null);
  }, []);

  const onBoxChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      applyDigits(next);
      return;
    }

    const chars = cleaned.slice(0, BOX_COUNT - index).split('');
    const next = [...digits];
    chars.forEach((ch, i) => {
      next[index + i] = ch;
    });
    applyDigits(next);
    focusBox(Math.min(index + chars.length, BOX_COUNT - 1));
  };

  const onBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = '';
      applyDigits(next);
      focusBox(index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight' && index < BOX_COUNT - 1) {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const onBoxPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    const chars = pasted.slice(0, BOX_COUNT - index).split('');
    const next = [...digits];
    chars.forEach((ch, i) => {
      next[index + i] = ch;
    });
    applyDigits(next);
    focusBox(Math.min(index + chars.length, BOX_COUNT - 1));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    if (codeValue.length !== BOX_COUNT) {
      setError('Enter the 6-digit code.');
      setErrorCode('INVALID_CODE');
      return;
    }
    const result = await onSubmitCode(codeValue);
    if (result?.error) {
      setError(result.error);
      setErrorCode(result.code ?? 'BAD_CODE');
    }
  };

  const onResend = async () => {
    if (codeSentLocked || resending) return;
    setError(null);
    setErrorCode(null);
    setResending(true);
    // Show "Code Sent" immediately (no "Sending…" placeholder).
    setResendCooldownUntil(Date.now() + OTP_COOLDOWN_MS);
    setNowMs(Date.now());
    try {
      const res = await fetch(resendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResendCooldownUntil(0);
        setError(typeof data.error === 'string' ? data.error : 'Could not resend code.');
        setErrorCode(typeof data.code === 'string' ? data.code : null);
        return;
      }
      const ttl = typeof data.codeExpiresInMs === 'number' ? data.codeExpiresInMs : OTP_COOLDOWN_MS;
      setResendCooldownUntil(Date.now() + ttl);
      setNowMs(Date.now());
      applyDigits(Array(BOX_COUNT).fill(''));
      focusBox(0);
    } catch {
      setResendCooldownUntil(0);
      setError('Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <form className="auth-form auth-otp-form" onSubmit={onSubmit} noValidate>
      <label className="auth-label auth-otp-label" htmlFor="auth-otp-0">
        enter code
      </label>
      <div className="auth-otp-boxes" role="group" aria-label="6-digit verification code">
        {digits.map((digit, index) => (
          <input
            key={index}
            id={index === 0 ? 'auth-otp-0' : undefined}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            className="auth-input auth-otp-box"
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={submitting}
            aria-label={`Digit ${index + 1}`}
            onChange={(ev) => onBoxChange(index, ev.target.value)}
            onKeyDown={(ev) => onBoxKeyDown(index, ev)}
            onPaste={(ev) => onBoxPaste(index, ev)}
            onFocus={(ev) => ev.target.select()}
          />
        ))}
      </div>
      <AuthFormMessage error={error} errorCode={errorCode} />
      <button
        type="submit"
        className="auth-submit auth-submit--accent asset-range-button myinv-range-button"
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
      <p className="auth-otp-resend-row">
        <span className="auth-otp-resend-prompt">Didn&apos;t receive code?</span>
        <button
          type="button"
          className={`auth-otp-resend-button${codeSentLocked ? ' is-code-sent' : ''}`}
          onClick={onResend}
          disabled={codeSentLocked || resending}
          aria-disabled={codeSentLocked || resending}
        >
          {codeSentLocked ? 'Code Sent' : 'Resend Code'}
        </button>
      </p>
    </form>
  );
};

export default AuthOtpCodeForm;
