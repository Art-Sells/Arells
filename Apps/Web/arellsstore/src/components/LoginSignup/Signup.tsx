"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import Link from 'next/link';
import { signUp } from 'aws-amplify/auth';
import { generateWallet } from '../../lib/bitcoin';

const Signup: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showEmailExistsError, setEmailExistsError] = useState<boolean>(false);
  const [showPasswordsDontMatchError, setPasswordsDontMatchError] = useState<boolean>(false);
  const [showSignedUp, setSignedUp] = useState<boolean>(false);

  const closeEmailExistsError = () => setEmailExistsError(false);
  const closePasswordsDontMatchError = () => setPasswordsDontMatchError(false);
  const closeSignedUp = () => setSignedUp(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error states
    setEmailExistsError(false);
    setPasswordsDontMatchError(false);

    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordsDontMatchError(true);
      return;
    }

    try {
      // Sign up with Amplify Auth
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      // Check next steps in the sign-up process
      if (nextStep && nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        console.log('Confirmation code needed to complete sign up.');
        // Handle code confirmation (not implemented here)
      } else if (isSignUpComplete) {
        // Create a wallet and store it (optional, depending on your logic)
        const { address, privateKey } = generateWallet();
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, address, privateKey }),
        });
        setSignedUp(true);
      }
    } catch (error: any) {
      if (error.code === 'UsernameExistsException') {
        setEmailExistsError(true);
      } else {
        console.log('Error signing up:', error);
      }
    }
  };

  return (
    <>
      {showEmailExistsError && (
        <div id="login-error-wrapper">
          <div id="account-exists-content">
            <Image alt="" width={35} height={35} id="signup-error-image" src="/images/market/prohibited.png" />
            <p id="account-exists-words">email account</p>
            <p id="account-exists-wordsss">already exists</p>
            <button id="signup-error-close" onClick={closeEmailExistsError}>OK</button>
          </div>
        </div>
      )}
      {showPasswordsDontMatchError && (
        <div id="login-error-wrapper">
          <div id="account-exists-content">
            <Image alt="" width={35} height={35} id="signup-error-image" src="/images/market/prohibited.png" />
            <p id="account-exists-words">passwords</p>
            <p id="account-exists-wordsss">don't match</p>
            <button id="signup-error-close" onClick={closePasswordsDontMatchError}>OK</button>
          </div>
        </div>
      )}
      {showSignedUp && (
        <div id="account-created-wrapper">
          <div id="account-created-content">
            <Image alt="" width={35} height={35} id="account-created-image" src="/images/market/checkmark-ebony.png" />
            <p id="account-created-words">Account Created</p>
            <Link href="/account" passHref>
              <button id="account-created-close" onClick={closeSignedUp}>VIEW ACCOUNT</button>
            </Link>
          </div>
        </div>
      )}

      <p id="signup-title">SIGN UP</p>
      <div id="sign-up">
        <form id="myForm" onSubmit={handleSignUp}>
          <div id="enter-content">
            <input
              name="email"
              type="email"
              id="email-input"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div id="enter-content">
            <input
              name="password"
              type="password"
              id="password-input"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div id="enter-content">
            <input
              name="confirm_password"
              type="password"
              id="confirm-password-input"
              placeholder="confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <hr id="invisible-line-signup" />
          <button id="signup-button" type="submit">SIGN UP</button>
        </form>
      </div>
    </>
  );
};

export default Signup;