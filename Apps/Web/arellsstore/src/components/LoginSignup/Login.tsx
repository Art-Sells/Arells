/* eslint-disable @next/next/no-sync-scripts */
'use client';

// components/Login.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import '../../app/css/modals/buy/buy-modal.css';
import '../../app/css/modals/disconnect/disconnect-modal.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';

declare global {
  interface Window {
    google?: any;
  }
}

const Login: React.FC = () => {
  const router = useRouter();
  const { setEmail } = useUser();
  const [showLoggingIn, setLoggingIn] = useState<boolean>(false);
  const [showLoginError, setLoginError] = useState<boolean>(false);
  const [showGoogleError, setGoogleError] = useState<boolean>(false);
  const loginButtonRef = useRef<HTMLDivElement | null>(null);
  const signupButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const parseJwt = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  };

  const handleGoogleCredential = useCallback(
    (response: { credential?: string }) => {
      setLoginError(false);
      setGoogleError(false);
      if (!response?.credential) {
        setLoginError(true);
        return;
      }
      try {
        setLoggingIn(true);
        const payload = parseJwt(response.credential);
        const email = payload?.email;
        if (!email) {
          setLoginError(true);
          setLoggingIn(false);
          return;
        }
        setEmail(email);
        router.push('/account');
      } catch (error) {
        setLoginError(true);
        setLoggingIn(false);
      }
    },
    [router, setEmail]
  );

  const initGoogle = useCallback(() => {
    if (!googleClientId || !window.google || !loginButtonRef.current || !signupButtonRef.current) {
      return;
    }
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    });
    loginButtonRef.current.innerHTML = '';
    signupButtonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(loginButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: 260,
    });
    window.google.accounts.id.renderButton(signupButtonRef.current, {
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      width: 260,
    });
  }, [googleClientId, handleGoogleCredential]);

  useEffect(() => {
    if (!googleClientId) {
      setGoogleError(true);
      return;
    }
    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }
    const scriptId = 'google-identity-script';
    if (document.getElementById(scriptId)) {
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    script.onerror = () => setGoogleError(true);
    document.body.appendChild(script);
  }, [googleClientId, initGoogle]);

  const closeLoginError = () => {
    setLoginError(false);
  };

  return (
    <>
      {showLoginError && (
        <div id="login-error-wrapper">
          <div id="login-error-content">
            <Image 
              alt="" 
              width={35}
              height={35}
              id="login-error-image" 
              src="/images/market/prohibited.png"
            />  
            <p id="login-error-words">wrong</p>
            <p id="login-error-wordss">email and/or password</p>
            <p id="login-error-wordsss">combo</p>
            <button id="login-error-close" onClick={closeLoginError}>OK</button> 
          </div>
        </div>  
      )}
      {showLoggingIn && (
        <div id="buying-wrapper">
          <div id="buying-content">
            <Image
              alt=""
              width={22}
              height={22}
              id="buying-image"
              src="/images/market/open-door.png"
            />
            <div className={stylings.marketplaceloader}></div>
            <p id="buying-words">logging in</p>
          </div>
        </div>
      )}
      <p id="login-title">LOGIN</p>
      <div id="log-in">
        <div id="enter-content" style={{ display: 'flex', justifyContent: 'center' }}>
          <div ref={loginButtonRef} />
        </div>
      </div>

      <p id="no-account">NO ACCOUNT? SIGN UP</p>
      <div id="enter-content" style={{ display: 'flex', justifyContent: 'center' }}>
        <div ref={signupButtonRef} />
      </div>
      {showGoogleError && <p id="login-error-words">Google sign-in is unavailable.</p>}
    </>
  );
};

export default Login;