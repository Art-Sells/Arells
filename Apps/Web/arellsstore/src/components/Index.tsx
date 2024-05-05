"use client";

// Assuming that there's no global type definitions for Next.js Image and Link components
import type { ImageLoaderProps } from 'next/image';

// Change below link after test
import '../app/css/Home.css';

// Loader Styles
import '../app/css/modals/loading/spinnerBackground.css';
import styles from '../app/css/modals/loading/spinner.module.css';

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
    beforeArells: false,
    afterArells: false,
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
            id="arells-loader-icon" 
            src="images/Arells-Icon.png"/>    
            <div className={styles.spinner}></div>    
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
          <hr id="black-liner"/>
          <div id="crypto-images-wrapper">
            <span>
              <div id="before-arells">
                <Image 
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('beforeArells')}
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
                  onLoad={() => handleImageLoaded('afterArells')}
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
          </div>
          


          
  

          <Link href="/" passHref>
            <button id="updatess">
              SIGN UP FOR EARLY ACCESS
            </button>
          </Link>    

          {/* <hr id="black-liner-bottom"/>

          <Link href="/" passHref>
            <button id="howitworks">
              HOW IT WORKS
            </button>
          </Link>         */}
        </div>
   
    </>
  );
}

export default Index;
