'use client';

// components/Login.tsx
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import '../../app/css/modals/buy/buy-modal.css';
import '../../app/css/modals/export/export-modal.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';
import Link from 'next/link';
import { signIn, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import CryptoJS from 'crypto-js';

interface Attribute {
    Name: string;
    Value: string;
}

const Login: React.FC = () => {
    const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const router = useRouter();
    const { setEmail, setBitcoinAddress, setBitcoinPrivateKey } = useUser();
    const [email, setEmailState] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showLoggingIn, setLoggingIn] = useState<boolean>(false);
    const [showLoginError, setLoginError] = useState<boolean>(false);

    const logIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoginError(false);

        try {
            // Sign out any existing user
            setLoggingIn(true);
            

            const user = await signIn({ username: email, password });

            // Fetch user attributes
            const attributesResponse = await fetchUserAttributes();

            const emailAttribute = attributesResponse['email'];
            const bitcoinAddress = attributesResponse['custom:bitcoinAddress'];
            const encryptedBitcoinPrivateKey = attributesResponse['custom:bitcoinPrivateKey'];

            if (emailAttribute) setEmail(emailAttribute);
            if (bitcoinAddress) setBitcoinAddress(bitcoinAddress);
            if (encryptedBitcoinPrivateKey) {
                const bytes = CryptoJS.AES.decrypt(encryptedBitcoinPrivateKey, password);
                const decryptedPrivateKey = bytes.toString(CryptoJS.enc.Utf8);
                setBitcoinPrivateKey(decryptedPrivateKey);
            }

            if (bitcoinAddress && encryptedBitcoinPrivateKey) {
                setEmail(email);  // Set the email in UserContext
            } else {
                console.log('Bitcoin attributes not found');
            }

            setTimeout(() => {
                setLoggingIn(false);
                router.push('/account');
            });
        } catch (error) {
            console.log('Error logging in:', error);
            setLoggingIn(false);
            setLoginError(true);
        }
    };
    useEffect(() => {
        signOut();
    }, []);

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
                <form id="myForm" onSubmit={logIn}>
                    <div id="enter-content">
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="email"
                            id="email-input"
                            value={email}
                            onChange={(e) => setEmailState(e.target.value)}
                        />
                    </div>
                    <div id="enter-content">
                        <input 
                            name="password" 
                            type="password" 
                            placeholder="password"
                            id="password-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button id="login-button" type="submit">LOGIN</button>
                </form>
            </div>

            <p id="no-account">NO ACCOUNT? SIGN UP</p>

            <Link href="/signup" passHref>
                <button id="signup-button">SIGN UP</button>
            </Link> 
        </>
    );
}

export default Login;