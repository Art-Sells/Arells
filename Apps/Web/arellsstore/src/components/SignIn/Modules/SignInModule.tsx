"use client";

import { signIn, ClientSafeProvider } from 'next-auth/react';

import '../../../app/css/signinup.css';
import { useState } from 'react';

import Image from 'next/image';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';
import Link from 'next/link';

type SignInModuleProps = {
    providers: Record<string, ClientSafeProvider>; 
};
  
const SignInModule: React.FC<SignInModuleProps> = ({ providers }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showLoading, setLoading] = useState(false);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `${src}?w=${width}&q=${quality || 100}`;
      };

    return (
        <>
            {showLoading && (
                <div id="spinnerBackground">
                <Image 
                    loader={imageLoader}
                    alt="" 
                    width={29}
                    height={30}
                    id="arells-loader-icon-asset" 
                    src="/images/Arells-Icon.png"/>   
                    <div className={styles.spinner}></div>     
                </div>
            )}
            {Object.values(providers).map((provider) => (
            <div>
                <p id="signinup-title">
                    SIGN IN</p>
                <p id="signinup-word">
                    Email</p>
                <input
                    id="signinup-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}  
                />
                <p id="signinup-word">
                    Password</p>
                <input
                    id="signinup-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}   
                />
                <br></br>
                <button 
                    onClick={() => signIn('credentials', { 
                        redirect: false,
                        email, 
                        password 
                    })}
                    id="signinup-register">
                    SIGN IN
                </button>
                <br></br>
                <Link legacyBehavior href={`/signup`} passHref>
                    <button id="signup-button" >
                        SIGN UP</button>
                </Link>
            </div>            
        ))}
        </>
    );
};


export default SignInModule;