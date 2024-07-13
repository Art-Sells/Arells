"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/loginsignup/loginsignup.css';
import '../../app/css/modals/loginsignup/loginsignup-modal.css';
import '../../app/css/modals/buy/buy-modal.css';
import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';
import Link from 'next/link';
import { signUp } from 'aws-amplify/auth';
import { generateWallet } from '../../lib/bitcoin';

const Confirm: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
      }
    //Loader Function/s

    const [showSigningUp, setSigningUp] = useState<boolean>(false);
    const [showSignedUp, setSignedUp] = useState<boolean>(false);
    const [showCheckConfirmationCode, setCheckConfirmationCode] = useState<boolean>(false);

    const closeSignedUp = () => setSignedUp(false);
    const closeCheckConfirmationCode = () => setCheckConfirmationCode(false);


    // setTimeout(async () => {
    //     console.log('Sign up complete. Generating wallet...');
    //     const wallet = await generateWallet();
    //     console.log('Wallet generated:', wallet);

    //     // Simulate successful user creation without making an API call
    //     console.log('User creation successful.');

    //     setSigningUp(false);
    //     setSignedUp(true);
    //   }, 3000);


    return (
        <>
            {showCheckConfirmationCode && (
                <div id="login-error-wrapper">
                <div id="account-exists-content">
                    <Image 
                    alt="" 
                    width={35} 
                    height={35} 
                    id="signup-error-image" 
                    src="/images/market/prohibited.png" 
                    />
                    <p id="account-exists-words">check</p>
                    <p id="account-exists-wordsss">confirmation code</p>
                    <button id="signup-error-close" 
                    onClick={closeCheckConfirmationCode}>OK</button>
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
                    <p id="buying-words">confirming account</p>
                </div>
                </div>
            )}
            {showSignedUp && (
                <div id="account-created-wrapper">
                <div id="account-created-content">
                    <Image alt="" width={35} height={35} id="account-created-image" src="/images/market/checkmark-ebony.png" />
                    <p id="account-created-words">Account Confirmed</p>
                    <Link href="/account" passHref>
                    <button id="account-created-close" onClick={closeSignedUp}>VIEW ACCOUNT</button>
                    </Link>
                </div>
                </div>
            )}
            <p id="confirm-title">
                CONFIRM ACCOUNT
            </p>
            <div id="confirm">
                <p id="confirm-instructions">
                    Check Email for confirmation code.
                </p>
                <form id="myForm">
                    <div id="enter-content">
                        <input name="confirmation-code" 
                        type="tel"
                        placeholder='confirmation code'
                            id="confirmation-input" ></input>
                    </div>
                    <button id="confirm-button"
                        //onClick={confirm}
                        >SUBMIT</button>
                </form>
            </div>

        </>
    );
}

export default Confirm;