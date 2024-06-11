"use client";

import type { ImageLoaderProps } from 'next/image';

// Change below link after test
import '../app/css/Home.css';
import BitcoinChart from '../components/Bitcoin/BitcoinChart';

// Loader Styles
import '../app/css/modals/loading/spinnerBackground.css';
import styles from '../app/css/modals/loading/spinner.module.css';
import '../app/css/stayupdated.css';
import '../app/css/modals/stayupdated-modal.css';

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
    wordLogo: false,
  });

  const handleImageLoaded = (imageName: string) => {
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
          onLoad={() => handleImageLoaded('wordLogo')}
          alt=""
          width={120}
          height={40}
          id="word-logoo" 
          src="images/Arells-Logo-Ebony.png"/>	        


          <p id="descriptioner">
            NEVER LOSE MONEY SELLING
            <span id="ada-description">CRYPTOCURRENCIES</span>
          </p>



          <BitcoinChart />

          <Link href="/login" passHref>
            <button id="submit">
              LOGIN
            </button>
          </Link> 
   
    </>
  );
}

export default Index;