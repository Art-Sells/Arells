'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatAuthErrorMessage } from '../../lib/auth/formatAuthErrorMessage';

type AuthFormMessageProps = {
  error: string | null;
  errorCode?: string | null;
};

const FADE_MS = 500;

/**
 * Keeps the last error mounted while opacity fades out so CSS transitions work both ways.
 */
const AuthFormMessage: React.FC<AuthFormMessageProps> = ({ error, errorCode }) => {
  const [payload, setPayload] = useState<{ text: string; code: string | null } | null>(null);
  const [visible, setVisible] = useState(false);
  const hadErrorRef = useRef(false);

  useEffect(() => {
    if (error) {
      setPayload({ text: error, code: errorCode ?? null });
      if (!hadErrorRef.current) {
        setVisible(false);
        const t = window.setTimeout(() => setVisible(true), 0);
        hadErrorRef.current = true;
        return () => window.clearTimeout(t);
      }
      setVisible(true);
      hadErrorRef.current = true;
      return;
    }

    const had = hadErrorRef.current;
    hadErrorRef.current = false;
    setVisible(false);
    if (!had) return;
    const t = window.setTimeout(() => setPayload(null), FADE_MS);
    return () => window.clearTimeout(t);
  }, [error, errorCode]);

  return (
    <div className="auth-message-slot" aria-hidden={!visible || !payload}>
      {payload ? (
        <p
          className={`auth-message auth-message--error auth-message--${payload.code || 'generic'}${visible ? ' auth-message--visible' : ''}`}
          role={visible ? 'alert' : undefined}
        >
          {formatAuthErrorMessage(payload.text)}
        </p>
      ) : null}
    </div>
  );
};

export default AuthFormMessage;
