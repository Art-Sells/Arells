'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatAuthErrorMessage } from '../../lib/auth/formatAuthErrorMessage';

type AuthFormMessageProps = {
  error: string | null;
  errorCode?: string | null;
};

const FADE_MS = 500;
/** Must match `.auth-message-slot--policy` `max-height` transition in Home.css */
const POLICY_EXPAND_MS = 450;

function isPolicyCode(code: string | null): boolean {
  return code === 'PASSWORD_POLICY' || code === 'PASSWORD_SHORT';
}

/**
 * Keeps the last error mounted while opacity fades out. PASSWORD_POLICY (legacy PASSWORD_SHORT) uses a
 * measured grid height expand/collapse; other codes keep the original fixed-slot behavior.
 */
const AuthFormMessage: React.FC<AuthFormMessageProps> = ({ error, errorCode }) => {
  const [payload, setPayload] = useState<{ text: string; code: string | null } | null>(null);
  const [visible, setVisible] = useState(false);
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const hadErrorRef = useRef(false);

  useLayoutEffect(() => {
    if (error) {
      setPayload({ text: error, code: errorCode ?? null });
      setVisible(false);
      setPolicyExpanded(false);
    }
  }, [error, errorCode]);

  useEffect(() => {
    if (error && isPolicyCode(errorCode ?? null)) {
      let innerRaf = 0;
      const outerRaf = requestAnimationFrame(() => {
        innerRaf = requestAnimationFrame(() => {
          setPolicyExpanded(true);
        });
      });
      return () => {
        cancelAnimationFrame(outerRaf);
        if (innerRaf) cancelAnimationFrame(innerRaf);
      };
    }
  }, [error, errorCode]);

  useEffect(() => {
    if (!policyExpanded || !error || !isPolicyCode(errorCode ?? null)) return;
    const t = window.setTimeout(() => {
      setVisible(true);
    }, POLICY_EXPAND_MS);
    return () => window.clearTimeout(t);
  }, [policyExpanded, error, errorCode]);

  useEffect(() => {
    if (error) {
      hadErrorRef.current = true;
      if (isPolicyCode(errorCode ?? null)) {
        return;
      }
      const t = window.setTimeout(() => {
        setVisible(true);
      }, 48);
      return () => window.clearTimeout(t);
    }

    setVisible(false);
    if (!hadErrorRef.current) return;

    const codeAtClear = payload?.code ?? null;

    if (isPolicyCode(codeAtClear)) {
      let t2 = 0;
      const t1 = window.setTimeout(() => {
        setPolicyExpanded(false);
        t2 = window.setTimeout(() => {
          setPayload(null);
          hadErrorRef.current = false;
        }, POLICY_EXPAND_MS);
      }, FADE_MS);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    const t = window.setTimeout(() => {
      setPayload(null);
      hadErrorRef.current = false;
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [error, errorCode, payload]);

  if (!payload) {
    return (
      <div className="auth-message-slot" aria-hidden>
        {null}
      </div>
    );
  }

  const policy = isPolicyCode(payload.code);

  const messageClass = `auth-message auth-message--error auth-message--${payload.code || 'generic'}${
    visible ? ' auth-message--visible' : ''
  }`;

  if (policy) {
    return (
      <div
        className={`auth-message-slot auth-message-slot--policy${policyExpanded ? ' auth-message-slot--policy-expanded' : ''}`}
        aria-hidden={!visible || !payload}
      >
        <p className={messageClass} role={visible ? 'alert' : undefined}>
          {formatAuthErrorMessage(payload.text)}
        </p>
      </div>
    );
  }

  return (
    <div className="auth-message-slot" aria-hidden={!visible || !payload}>
      <p className={messageClass} role={visible ? 'alert' : undefined}>
        {formatAuthErrorMessage(payload.text)}
      </p>
    </div>
  );
};

export default AuthFormMessage;
