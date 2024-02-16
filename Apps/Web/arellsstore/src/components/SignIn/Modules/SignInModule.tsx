"use client";

import { signIn, ClientSafeProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSigner from '../../../state/signer';

import '../../../app/css/signinup.css';
import '../../../app/css/modals/signupin-modals.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

type SignInModuleProps = {
    providers?: Record<string, ClientSafeProvider>; 
};
  
const SignInModule: React.FC<SignInModuleProps> = ({ providers = {} }) => {
    const { address } = useSigner();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showLoading, setLoading] = useState<boolean>(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `${src}?w=${width}&q=${quality || 100}`;
      };
      const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
        arellsIcon: false,
      });
    
      const handleImageLoaded = (imageName: string) => {
        console.log(`Image loaded: ${imageName}`);
        setImagesLoaded(prevState => ({ 
          ...prevState, 
          [imageName]: true 
        }));
      };
    
      useEffect(() => {
        if (Object.values(imagesLoaded).every(Boolean)) {
            setLoading(false);
        }
    }, [imagesLoaded]);  

//Modal functions below

    const [showFillEmptyFieldsModal, setFillEmptyFieldsModal] = useState<boolean>(false);
    const [showInvalidEmailModal, setInvalidEmailModal] = useState<boolean>(false);
    const [showEmailExistsModal, setEmailExistsModal] = useState<boolean>(false);
    const [showSignedUpModal, setSignedUpModal] = useState<boolean>(false);

    const closeFillEmptyFieldsModal = () => {
        setFillEmptyFieldsModal(false);
    };
    function openFillEmptyFieldsModal() {
        setFillEmptyFieldsModal(true);
    };

    const closeInvalidEmailModal = () => {
        setInvalidEmailModal(false);
    };
    function openInvalidEmailModal() {
        setInvalidEmailModal(true);
    };

    const closeEmailExistsModal = () => {
        setEmailExistsModal(false);
        window.location.reload();
    };
    function openEmailExistsModal() {
        setEmailExistsModal(true);
    };

    function openSignedUpModal() {
        setSignedUpModal(true);
    };

//Modal Functions Above    

//Sign in functions below
    const handleSignIn = async () => {
        if (!email || !password) {
            openFillEmptyFieldsModal();
            return;
        }

        try {

            const result = await signIn('credentials', {
                email,
                password,
                redirect: false, 
            });

            if (result && result.error) {
                if (result.error === 'Invalid email or password') {
                    openInvalidEmailModal();
                } else {
                    openFillEmptyFieldsModal(); 
                }
            } else {
                openSignedUpModal();
            }
        } catch (error) {
            console.error('Sign-In Error:', error);
            alert('An error occurred during sign-in.');
        }
    };
//Sign In functions above



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




        {showFillEmptyFieldsModal && (
            <div id="signinup-error-wrapper">
                <div id="signinup-error-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={35}
                    height={35}
                    id="signinup-error-image" 
                    src="/images/market/error.png"/>  
                <p id="signinup-error-words">Fill empty fields</p>
                <button id="signinup-error-close"
                    onClick={closeFillEmptyFieldsModal}>OK</button> 
                </div>
            </div>  
        )}
        {showInvalidEmailModal && (
            <div id="signinup-error-wrapper">
                <div id="signinup-combo-error-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={35}
                    height={35}
                    id="signinup-error-image" 
                    src="/images/market/error.png"/>  
                <p id="signinup-combo-top-error-words">Invalid Email/Password</p>
                <p id="signinup-combo-bottom-error-words">combo</p>
                <button id="signinup-error-close"
                    onClick={closeInvalidEmailModal}>OK</button> 
                </div>
            </div>  
        )}
        {showEmailExistsModal && (
            <div id="signinup-error-wrapper">
                <div id="signinup-error-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={35}
                    height={35}
                    id="signinup-error-image" 
                    src="/images/market/error.png"/>  
                <p id="signinup-error-words">Email doesn't exit</p>
                <button id="signinup-error-close"
                    onClick={closeEmailExistsModal}>OK</button> 
                </div>
            </div>  
        )}




        {showSignedUpModal && (
            <div id="signinup-success-wrapper">
                <div id="signinup-success-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={35}
                    height={35}
                    id="signinup-success-image" 
                    src="/images/market/check-mark.png"/>  
                <p id="signinup-success-words">SIGNED IN</p>
                <Link legacyBehavior href={`/own/${address}`} passHref>
                        <button id="signinup-success-close"
                            >ENTER STORE</button> 
                </Link>
                </div>
            </div>  
        )}

            <div>
                <Image 
                    loader={imageLoader}
                    onLoad={() => handleImageLoaded('arellsIcon')}
                    alt="" 
                    width={20}
                    height={21}
                    id="arells-signupin-icon" 
                    src="/images/Arells-Icon.png"/>
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
                    onClick={handleSignIn} 
                    id="signinup-register">
                    SIGN IN
                </button>
                <br></br>
                <Link legacyBehavior href={`/signup`} passHref>
                    <button id="signup-button" >
                        SIGN UP</button>
                </Link>
            </div>            
        
        </>
    );
};


export default SignInModule;