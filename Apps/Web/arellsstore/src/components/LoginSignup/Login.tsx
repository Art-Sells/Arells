"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import $ from 'jquery';
import Link from 'next/link';

const Login: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
      }
    //Loader Function/s


    const [showLoginError, setLoginError] = useState<boolean>(true);

    const logIn = () => {
    };

    const closeLoginError = () => {
        setLoginError(false);
    };

    return (
        <>
            {showLoginError && (
                <div id="login-error-wrapper">
                    <div id="login-error-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={35}
                        height={35}
                        id="login-error-image" 
                        src="/images/market/prohibited.png"/>  
                    <p id="login-error-words">Wrong</p>
                    <p id="login-error-wordss">Email and/or Password</p>
                    <p id="login-error-wordsss">combo</p>
                    <button id="login-error-close"
                        onClick={closeLoginError}>OK</button> 
                    </div>
                </div>  
            )}

            <div id="log-in">
                <form id="myForm">
                    <div id="enter-content">
                        <input name="email" type="email"
                        placeholder='email'
                            id="email-input" ></input>
                    </div>
                    <div id="enter-content">
                        <input name="first_name" type="password"
                         placeholder='password'
                            id="password-input" ></input>
                    </div>
                    <hr id="invisible-line"/>
                    <a id="login-button"
                        onClick={logIn}>LOGIN</a>
                </form>
            </div>

            <p id="no-account">NO ACCOUNT? SIGN UP</p>

            <Link href="/signup" passHref>
                <button id="signup-button">
                SIGN UP
                </button>
            </Link> 

        </>
    );
}

export default Login;