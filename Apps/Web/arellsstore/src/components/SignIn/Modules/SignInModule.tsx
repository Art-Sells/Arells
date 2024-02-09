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
        
        </>
    );
};


export default SignInModule;