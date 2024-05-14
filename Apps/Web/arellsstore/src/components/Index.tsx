"use client";

// Assuming that there's no global type definitions for Next.js Image and Link components
import type { ImageLoaderProps } from 'next/image';

// Change below link after test
import '../app/css/Home.css';

// Loader Styles
import '../app/css/modals/loading/spinnerBackground.css';
import styles from '../app/css/modals/loading/spinner.module.css';
import '../app/css/stayupdated.css';
import '../app/css/modals/stayupdated-modal.css';
import $ from 'jquery';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';

const Index = () => {
// Loader Functions
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


  const [showEnterInformation, setEnterInformation] = useState<boolean>(false);
  const [showSubmitted, setSubmitted] = useState<boolean>(false);

  const signUp = () => {
    if (typeof window !== 'undefined') {
        const emailInput = (document.getElementById('email-input') as HTMLInputElement).value;

        if (emailInput === "" ) {
            setEnterInformation(true);
        } else {
            $.ajax({
                url: "https://api.apispreadsheets.com/data/6T0aVzc5FSPAbNSH/",
                type: "post",
                data: $("#myForm").serializeArray(),
                headers: {
                    accessKey:"6dc5c76c0cd9a9ab87f5bd2e8a9b57e2", 
                    secretKey:"4a6ce35719e814296ef47d5d90b85bf8"
                }
            });
            (document.getElementById('email-input') as HTMLInputElement).value = "";
            setSubmitted(true);
        }
    }
  };

  const closeEnterInformation = () => {
    setEnterInformation(false);
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
            id="arells-loader-icon" 
            src="images/Arells-Icon.png"/>    
            <div className={styles.spinner}></div>    
        </div>
      )}



            {showEnterInformation && (
                <div className="RWmodal">
                    <div className="RWmodal-content">
                        <p className="enter-info">ENTER EMAIL</p>
                        <button className="RWclose" onClick={closeEnterInformation}>OK</button>
                    </div>
                </div>
            )}

            {showSubmitted && (
                <div className="RWmodal-submitted">
                    <div className="RWmodal-content-submitted">
                        <p className="submission-successful">JOINED</p>
                        <div className="contact-submit">
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

                            {/* <Link href="https://twitter.com/arellsofficial" 
                                passHref
                                className="twitter-contacts">
                                <Image 
                                loader={imageLoader}
                                alt="" 
                                width={25}
                                height={25}
                                id="twitter-contact" 
                                src="images/signup/twitter-ebony.png"/>
                            </Link>   */}

                        </div>
                        <p className="contact-title-description">
                            NEVER LOSE MONEY SELLING CRYPTOCURRENCIES
                        </p>
                        <p className="contact-coming-soon">
                            COMING SOON
                        </p>
                    </div>
                </div>
            )}

          <Image 
            loader={imageLoader}
            onLoad={() => handleImageLoaded('arellsIcon')}
            alt="" 
            width={80}
            height={85}
            id="arells-iconn" 
            src="images/Arells-Icon.png"/>
        
          <br/>
          
          <Image
          loader={imageLoader}
          onLoad={() => handleImageLoaded('wordLogo')}
          alt=""
          width={120}
          height={40}
          id="word-logoo" 
          src="images/Arells-Logo-Ebony.png"/>	
          
          <br/>
        
        <div>          
          <p id="descriptioner">
          NEVER LOSE MONEY SELLING
          </p>
          <hr id="black-liner"/>
          <p id="ada-description">
            CRYPTOCURRENCIES
          </p>
          {/* <div id="crypto-images-wrapper">
            <span>
              <div id="before-arells">
                <Image 
                  loader={imageLoader}
                  alt="" 
                  width={80}
                  height={80}
                  id="before-arells-image" 
                  src="images/market/BitcoinBefore.jpg"/>
              </div>
            </span>
            <span>
              <div id="after-arells">
                <Image 
                  loader={imageLoader}
                  alt="" 
                  width={80}
                  height={80}
                  id="after-arells-image" 
                  src="images/market/BitcoinAfter.jpg"/>
              </div>
            </span>
          </div>
          
          <div id="before-after-words">
            <span id="before-word">BEFORE</span>
            <span id="after-word">AFTER</span>
          </div> */}
          <div id="sign-up">
                <p id="stay-updated">JOIN FOR MORE INFORMATION</p>

                <form id="myForm">
                    <div id="enter-content">
                        <input name="email" type="email"
                            id="email-input" placeholder='e-mail'></input>
                    </div>
                    <br />
                    <a id="submit"
                        onClick={signUp}>JOIN</a>
                </form>
            </div>

          
  



          {/* <Link href="/signup" passHref>
            <button id="updatess">
              SIGN UP FOR EARLY ACCESS
            </button>
          </Link>     */}

        </div>
   
    </>
  );
}

export default Index;
