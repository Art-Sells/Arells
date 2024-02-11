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

// In SignUpModule.tsx
type SignUpModuleProps = {
    providers?: Record<string, ClientSafeProvider>; // Note the optional marker
};

  
const SignUpModule: React.FC<SignUpModuleProps> = ({ providers = {}}) => {
    const { address } = useSigner();


    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


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
    const [showPasswordsNeedModal, setPasswordsNeedModal] = useState<boolean>(false);
    const [showPasswordsUnmatchedModal, setPasswordsUnmatchedModal] = useState<boolean>(false);
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

    const closePasswordsNeedModal = () => {
        setPasswordsNeedModal(false);
    };
    function openPasswordsNeedModal() {
        setPasswordsNeedModal(true);
    };

    const closePasswordsUnmatchedModal = () => {
        setPasswordsUnmatchedModal(false);
    };
    function openPasswordsUnmatchedModal() {
        setPasswordsUnmatchedModal(true);
    };

    function openSignedUpModal() {
        setSignedUpModal(true);
    };

//Modal Functions Above    



// Sign Up Function below
    const validateInputs = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            openInvalidEmailModal();
            return false;
        } else if (!emailRegex.test(email)) {
            openInvalidEmailModal(); // Consider a specific modal for format issues
            return false;
        } else if (password !== confirmPassword) {
            openPasswordsUnmatchedModal();
            return false;
        }
        return true;
    };

    const signUpUser = async () => {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        return { success: response.ok, data };
    };

    const handleSignUpResponse = async (response: { success: boolean; data: any; }) => {
        if (response.success) {
            try {
                const signInResponse = await signIn('credentials', {
                    redirect: false, 
                    email: email, 
                    password: password, 
                });

                if (signInResponse?.error) {
                    openInvalidEmailModal(); 
                } else {
                    openSignedUpModal();
                }
            } catch (error) {
                console.error('Error during automatic sign-in:', error);
                alert('An error occurred during automatic sign-in.');
            }
        } else {
            // Handle sign-up errors as before
            const { error } = response.data;
            if (error.includes('exists')) {
                openEmailExistsModal();
            } else if (error.includes('criteria')) {
                openPasswordsNeedModal();
            } else {
                openFillEmptyFieldsModal();
            }
        }
    };
    

    const handleSignUp = async () => {
        if (!validateInputs()) return;

        try {
            const response = await signUpUser();
            handleSignUpResponse(response);
        } catch (error) {
            console.error('SignUp Error:', error);
            alert('An error occurred during sign up.');
        }
    };
//Sign up Functions Above



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
                    <div id="signinup-error-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={35}
                        height={35}
                        id="signinup-error-image" 
                        src="/images/market/error.png"/>  
                    <p id="signinup-error-words">Invalid Email</p>
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
                    <p id="signinup-error-words">Email already exits</p>
                    <button id="signinup-error-close"
                        onClick={closeEmailExistsModal}>OK</button> 
                    </div>
                </div>  
            )}
            {showPasswordsNeedModal && (
                <div id="signinup-password-error-wrapper">
                    <div id="signinup-password-error-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={35}
                        height={35}
                        id="signinup-password-error-image" 
                        src="/images/market/error.png"/>  
                    <p id="signinup-password-top-error-words">Password needs at least eight characters total.</p>
                    <p id="signinup-password-error-words">One capital letter(A-Z), one lowercase letter(a-z),</p>
                    <p id="signinup-password-bottom-error-words">one number(0-9) and one special character(!-%).</p>
                    <button id="signinup-password-error-close"
                        onClick={closePasswordsNeedModal}>OK</button> 
                    </div>
                </div>  
            )}    
            {showPasswordsUnmatchedModal && (
                <div id="signinup-error-wrapper">
                    <div id="signinup-error-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={35}
                        height={35}
                        id="signinup-error-image" 
                        src="/images/market/error.png"/>  
                    <p id="signinup-error-words">Passwords don't match.</p>
                    <button id="signinup-error-close"
                        onClick={closePasswordsUnmatchedModal}>OK</button> 
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
                    <p id="signinup-success-words">SIGNED UP</p>
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
                    SIGN UP</p>
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
                <p id="signinup-word">
                    Confirm Password</p>
                <input
                    id="confirm-signinup-input" // Ensure IDs are unique
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <br></br>
                <button 
                    onClick={handleSignUp} // Update this line to use the new handleSignUp function
                    id="signinup-register">
                    SIGN UP
                </button>
            </div>            
        
        </>
    );
};


export default SignUpModule;