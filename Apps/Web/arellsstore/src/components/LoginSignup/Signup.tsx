"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import '../../app/css/modals/buy/buy-modal.css';
import '../../app/css/modals/export/export-modal.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';
import Link from 'next/link';
import { signUp, signIn, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '../../context/UserContext';
import { generateWallet } from '../../lib/bitcoin';

interface Attribute {
    Name: string;
    Value: string;
}

const Signup: React.FC = () => {
    const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const router = useRouter();
    const { setEmail, setBitcoinAddress, setBitcoinPrivateKey } = useUser();
    const [email, setEmailState] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPasswordsError, setPasswordsError] = useState<boolean>(false);
    const [showEmailError, setEmailError] = useState<boolean>(false);
    const [showMissingFields, setMissingFields] = useState<boolean>(false);
    const [showSigningUp, setSigningUp] = useState<boolean>(false);
    const [showEmailExistsError, setEmailExistsError] = useState<boolean>(false);
    const [showPasswordsDontMatchError, setPasswordsDontMatchError] = useState<boolean>(false);
    const [showSignedUp, setSignedUp] = useState<boolean>(false);

    const closeEmailExistsError = () => setEmailExistsError(false);
    const closePasswordsDontMatchError = () => setPasswordsDontMatchError(false);
    const closePasswordsError = () => setPasswordsError(false);
    const closeEmailError = () => setEmailError(false);
    const closeSignedUp = () => setSignedUp(false);
    const closeMissingFields = () => setMissingFields(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        const minLength = 8;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && hasLetter && hasNumber && hasSpecialChar;
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setEmailExistsError(false);
        setPasswordsDontMatchError(false);
        setPasswordsError(false);
        setMissingFields(false);
        setEmailError(false);

        if (!email || !password || !confirmPassword) {
            setMissingFields(true);
            return;
        }

        if (!validateEmail(email)) {
            setEmailError(true);
            return;
        }

        if (!validatePassword(password)) {
            setPasswordsError(true);
            return;
        }

        if (password !== confirmPassword) {
            setPasswordsDontMatchError(true);
            return;
        }

        try {
            await signOut();
            setSigningUp(true);

            const wallet = await generateWallet();
            console.log('Wallet generated:', wallet);

            const { isSignUpComplete } = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        'custom:bitcoinAddress': wallet.address,
                        'custom:bitcoinPrivateKey': wallet.privateKey,
                    },
                },
            });

            if (isSignUpComplete) {
                console.log('User creation successful.');

                try {
                    const user = await signIn({ username: email, password });
                    console.log('User logged in:', user);

                    // Fetch user attributes
                    const attributesResponse = await fetchUserAttributes();
                    console.log('Fetched attributes:', attributesResponse);

                    // Convert attributes object to array format and handle undefined values
                    const attributesArray: Attribute[] = Object.keys(attributesResponse).map(key => ({
                        Name: key,
                        Value: attributesResponse[key] || ''
                    }));

                    const bitcoinAddress = attributesArray.find((attr: Attribute) => attr.Name === 'custom:bitcoinAddress')?.Value;
                    const bitcoinPrivateKey = attributesArray.find((attr: Attribute) => attr.Name === 'custom:bitcoinPrivateKey')?.Value;

                    if (bitcoinAddress && bitcoinPrivateKey) {
                        console.log('Bitcoin Address:', bitcoinAddress);
                        console.log('Bitcoin Private Key:', bitcoinPrivateKey);
                        setEmail(email);
                        setBitcoinAddress(bitcoinAddress);
                        setBitcoinPrivateKey(bitcoinPrivateKey);
                    } else {
                        console.log('Bitcoin attributes not found');
                    }

                    setTimeout(() => {
                        setSigningUp(false);
                        setSignedUp(true);
                    }, 3000);
                } catch (error) {
                    console.log('Error logging in:', error);
                    setSigningUp(false);
                }
            }
        } catch (error: any) {
            if (error.name === 'UsernameExistsException' || error.code === 'UsernameExistsException') {
                setEmailExistsError(true);
            } else {
                console.log('Error signing up:', error);
            }
            setSigningUp(false);
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
      {showSigningUp && (
        <div id="buying-wrapper">
          <div id="buying-content">
            <div className={stylings.marketplaceloader}></div>
            <Image
              alt=""
              width={22}
              height={22}
              id="buying-image"
              src="/images/market/profile-ivory.png"
            />
            <p id="buying-words">creating account</p>
          </div>
        </div>
      )}
      {showMissingFields && (
        <div id="export-failed-wrapper">
          <div id="missing-fields-content">
            <Image 
              alt="" 
              width={35} 
              height={11} 
              id="missing-fields-image" 
              src="/images/prototype/EnterNameErrorImage.png" 
            />  
            <p id="missing-fields-words">enter information</p>
            <button id="export-failed-close" onClick={closeMissingFields}>OK</button> 
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
      {showEmailError && (
        <div id="login-error-wrapper">
          <div id="account-exists-content">
            <Image 
              alt="" 
              width={35} 
              height={35} 
              id="signup-error-image" 
              src="/images/market/prohibited.png" 
            />
            <p id="account-exists-words">check @</p>
            <p id="account-exists-wordsss">email format</p>
            <button id="signup-error-close" onClick={closeEmailError}>OK</button>
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
            <p id="password-error-words">password needs</p>
            <p id="passwords-error-words">8 characters minimum</p>
            <p id="passwordss-error-words">one letter ( a-z | A-Z )</p>
            <p id="passwordssss-error-words">one number ( 0 - 9 )</p>
            <p id="passwordsssss-error-words">one special ( ! - * )</p>
            <button id="signup-error-close" onClick={closePasswordsError}>OK</button>
          </div>
        </div>
      )}
      {showSignedUp && (
        <div id="account-created-wrapper">
          <div id="account-created-content">
            <Image alt="" width={35} height={35} id="account-created-image" src="/images/market/checkmark-ebony.png" />
            <p id="account-created-words">Account Created</p>
            <Link href="/account" passHref>
              <button id="account-created-close">VIEW ACCOUNT</button>
            </Link>
          </div>
        </div>
      )}

      <p id="signup-title">SIGN UP</p>
      <div id="sign-up">
        <form id="myForm" onSubmit={handleSignUp} noValidate>
          <div id="enter-content">
            <input
              name="email"
              type="email"
              id="email-input"
              placeholder="email"
              value={email}
              onChange={(e) => setEmailState(e.target.value)}
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