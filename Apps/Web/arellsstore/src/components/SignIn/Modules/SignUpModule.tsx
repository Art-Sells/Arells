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
    const [showPasswordsNeedModal, setPasswordsNeedModal] = useState<boolean>(false);
    const [showInvalidEmailModal, setInvalidEmailModal] = useState<boolean>(false);
    const [showPasswordsUnmatchedModal, setPasswordsUnmatchedModal] = useState<boolean>(false);
    const [showEmailExistsModal, setEmailExistsModal] = useState<boolean>(false);
    const [showSignedUpModal, setSignedUpModal] = useState<boolean>(false);

    const closePasswordsNeedModal = () => {
        setPasswordsNeedModal(false);
    };
    function openPasswordsNeedModal() {
        setPasswordsNeedModal(true);
    };

    const closeInvalidEmailModal = () => {
        setInvalidEmailModal(false);
    };
    function openInvalidEmailModal() {
        setInvalidEmailModal(true);
    };

    const closePasswordsUnmatchedModal = () => {
        setPasswordsUnmatchedModal(false);
    };
    function openPasswordsUnmatchedModal() {
        setPasswordsUnmatchedModal(true);
    };

    const closeEmailExistsModal = () => {
        setEmailExistsModal(false);
        window.location.reload();
    };
    function openEmailExistsModal() {
        setEmailExistsModal(true);
    };

    const closeSignedUpModal = () => {
        setSignedUpModal(false);
    };
    function openSignedUpModal() {
        setSignedUpModal(true);
    };
//Modal Functions Above    

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




            {showPasswordsNeedModal && (
                <div id="claim-address-wrapper">
                    <div id="claim-address-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={22}
                        height={35}
                        id="claim-address-image" 
                        src="/images/market/location.png"/>  
                    <p id="claim-address-words">Password needs at least eight characters total.</p>
                    <p id="claim-address-words">one capital letter(A-Z), one lowercase letter(a-z),</p>
                    <p id="claim-address-words">one number(0-9) and one special character(!-%).</p>
                    <button id="claim-address-close"
                        onClick={closePasswordsNeedModal}>OK</button> 
                    </div>
                </div>  
            )}            
            {showInvalidEmailModal && (
                <div id="claim-address-wrapper">
                    <div id="claim-address-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={22}
                        height={35}
                        id="claim-address-image" 
                        src="/images/market/location.png"/>  
                    <p id="claim-address-words">Invalid Email</p>
                    <button id="claim-address-close"
                        onClick={closeInvalidEmailModal}>OK</button> 
                    </div>
                </div>  
            )}
            {showPasswordsUnmatchedModal && (
                <div id="claim-address-wrapper">
                    <div id="claim-address-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={22}
                        height={35}
                        id="claim-address-image" 
                        src="/images/market/location.png"/>  
                    <p id="claim-address-words">Passwords don't match</p>
                    <button id="claim-address-close"
                        onClick={closePasswordsUnmatchedModal}>OK</button> 
                    </div>
                </div>  
            )}
            {showEmailExistsModal && (
                <div id="claim-address-wrapper">
                    <div id="claim-address-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={22}
                        height={35}
                        id="claim-address-image" 
                        src="/images/market/location.png"/>  
                    <p id="claim-address-words">Email already exits</p>
                    <button id="claim-address-close"
                        onClick={closeEmailExistsModal}>OK</button> 
                    </div>
                </div>  
            )}
            {showSignedUpModal && (
                <div id="edit-modal-wrapper">
                    <div id="edit-modal-content">
                    <Image 
                        // loader={imageLoader}
                        alt="" 
                        width={35}
                        height={35}
                        id="changes-saved-image" 
                        src="/images/market/check-mark.png"/>  
                    <p id="edit-modal-words">SIGNED UP</p>
                    <Link legacyBehavior href={`/own/${address}`} passHref>
                            <button id="edit-modal-close"
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
                    SIGN UP
                </button>
            </div>            
        
        </>
    );
};


export default SignUpModule;