"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import $ from 'jquery';
import { signUp } from 'aws-amplify/auth';
import awsmobile from '../../aws-exports';

const Signup: React.FC = () => {
    // Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showEmailExistsError, setEmailExistsError] = useState<boolean>(false);
    const [showSubmitted, setSubmitted] = useState<boolean>(false);

    const closeEmailExistsError = () => {
        setEmailExistsError(false);
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
                    <div id="login-error-content">
                        <Image
                            alt=""
                            width={35}
                            height={35}
                            id="login-error-image"
                            src="/images/market/prohibited.png"
                        />
                        <p id="login-error-words">Email</p>
                        <p id="login-error-wordsss">already exists</p>
                        <button id="login-error-close" onClick={closeEmailExistsError}>OK</button>
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