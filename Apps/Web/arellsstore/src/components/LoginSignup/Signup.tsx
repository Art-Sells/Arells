"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import { signUp } from 'aws-amplify/auth';
import Link from 'next/link';

const Signup: React.FC = () => {

    const [createdWallet, setCreatedWallet] = useState<{ address: string; privateKey: string } | null>(null);

    // Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    const [showEmailExistsError, setEmailExistsError] = useState<boolean>(false);
    const [showPasswordsError, setPasswordsError] = useState<boolean>(false);
    const [showPasswordsDontMatchError, setPasswordsDontMatchError] = useState<boolean>(false);
    const [showSignedUp, setSignedUp] = useState<boolean>(false);

    const closeEmailExistsError = () => {
        setEmailExistsError(false);
    };

    const closePasswordsDontMatchError = () => {
        setPasswordsDontMatchError(false);
    };

    const closePasswordsError = () => {
        setPasswordsError(false);
    };

    const closeSignedUp = () => {
        setSignedUp(false);
    };

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const { isSignUpComplete, userId, nextStep } = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email
                    }
                }
            });
            createWallet();
        } catch (error: any) {
            if (error.code === 'UsernameExistsException') {
                setEmailExistsError(true);
            } else {
                console.log('Error signing up:', error);
            }
        }
    };

    const createWallet = async () => {
        try {
          const res = await fetch('/api/wallet');
          if (!res.ok) {
          }
          const data = await res.json();
          console.log("Wallet created:", data);
          setCreatedWallet(data);
        } catch (error) {
          console.error("Error in createWallet:", error);
        }
    };


    return (
        <>
            {showEmailExistsError && (
                <div id="login-error-wrapper">
                    <div id="account-exists-content">
                        <Image
                            alt=""
                            width={35}
                            height={35}
                            id="signup-error-image"
                            src="/images/market/prohibited.png"
                        />
                        <p id="account-exists-words">email account</p>
                        <p id="account-exists-wordsss">already exists</p>
                        <button id="signup-error-close" onClick={closeEmailExistsError}>OK</button>
                    </div>
                </div>
            )}
            {showPasswordsDontMatchError && (
                <div id="login-error-wrapper">
                    <div id="account-exists-content">
                        <Image
                            alt=""
                            width={35}
                            height={35}
                            id="signup-error-image"
                            src="/images/market/prohibited.png"
                        />
                        <p id="account-exists-words">passwords</p>
                        <p id="account-exists-wordsss">don't match</p>
                        <button id="signup-error-close" onClick={closePasswordsDontMatchError}>OK</button>
                    </div>
                </div>
            )}
            {showPasswordsError && (
                <div id="login-error-wrapper">
                    <div id="passwords-error-content">
                        <Image
                            alt=""
                            width={35}
                            height={35}
                            id="passwords-error-image"
                            src="/images/market/password-ivory.png"
                        />
                        <p id="passwords-error-words">password needs at least 8 characters</p>
                        <p id="passwordss-error-words">one letter ( A - Z ), one number ( 0 - 9 )</p>
                        <p id="passwordssss-error-words">and one character  ( ! - * )</p>
                        <button id="signup-error-close" onClick={closePasswordsError}>OK</button>
                    </div>
                </div>
            )}
            {showSignedUp && (
                <div id="account-created-wrapper">
                    <div id="account-created-content">
                        <Image
                            alt=""
                            width={35}
                            height={35}
                            id="account-created-image"
                            src="/images/market/checkmark-ebony.png"
                        />
                        <p id="account-created-words">Account Created</p>
                        <Link href="/account" passHref>
                            <button id="account-created-close" onClick={closeSignedUp}>VIEW ACCOUNT</button>
                        </Link>
                    </div>
                </div>
            )}


            <p id="signup-title">SIGN UP</p>
            <div id="sign-up">
                <form id="myForm">
                    <div id="enter-content">
                        <input
                            name="email"
                            type="email"
                            id="email-input"
                            placeholder='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div id="enter-content">
                        <input
                            name="password"
                            type="password"
                            id="password-input"
                            placeholder='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div id="enter-content">
                        <input
                            name="confirm_password"
                            type="password"
                            id="confirm-password-input"
                            placeholder='confirm password'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <hr id="invisible-line-signup" />
                    <button id="signup-button" onClick={handleSignUp}>
                        SIGN UP
                    </button>
                </form>
            </div>
        </>
    );
};

export default Signup;