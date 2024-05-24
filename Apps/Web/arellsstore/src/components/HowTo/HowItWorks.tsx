"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/howitworks/howitworks.css';
import '../../app/css/modals/stayupdated-modal.css';


// Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

const Signup: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
      }
      const [showLoading, setLoading] = useState<boolean>(true);
      const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
        arellsIcon: false,
        wordLogo: false,
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
    //Loader Function/s

    return (
        <>

        {showLoading && (
            <div id="spinnerBackground">
            <Image 
            loader={imageLoader}
                alt="" 
                width={29}
                height={30}
                id="arells-loader-icon" 
                src="images/Arells-Icon.png"/>    
                <div className={styles.spinner}></div>    
            </div>
        )}

            <p id="stay-updated">SIGN UP FOR EARLY ACCESS</p>


            <br />

            <div id="sign-up">
                <form id="myForm">
                    <div id="enter-content">
                        <label id="label">EMAIL</label>
                        <br />
                        <input name="email" type="email"
                            id="email-input" ></input>
                    </div>
                    <div id="enter-content">
                        <label id="label">FIRST NAME</label>
                        <br />
                        <input name="first_name" type="text"
                            id="first-input" ></input>
                    </div>
                    <div id="enter-content">
						<label id="label">LAST NAME</label>
						<br/>
						<input name="last_name" type="text" 
						id="last-input" ></input>
					</div>
                    <br />
                    <a id="submit">SUBMIT</a>
                </form>
            </div>

            <p className="contact-submit-question">Questions? Contact us:</p>

            <a href="mailto:info@arells.com"
                className="email-contacts" >
                <Image 
                loader={imageLoader}
                alt="" 
                width={25}
                height={25}
                id="email-contact" 
                src="images/signup/email-ivory.png"/>
            </a>   

        </>
    );
}

export default Signup;
