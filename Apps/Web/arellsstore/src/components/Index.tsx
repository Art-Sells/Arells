"use client";

import type { ImageLoaderProps } from 'next/image';

// Change below link after test
import '../app/css/Home.css';
import BitcoinChart from '../components/Bitcoin/BitcoinChart';

// Loader Styles
import '../app/css/modals/loader/accountloaderbackground.css';
import styles from '../app/css/modals/loader/accountloader.module.css';

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
        <div id="accountloaderbackground">
          <Image
            loader={imageLoader}
            alt=""
            width={29}
            height={30}
            id="arells-loader-icon-account"
            src="images/Arells-Icon.png"
          />
          <div id={styles.accountloader}></div>
        </div>
      )}

          
          <Image
          loader={imageLoader}
          onLoad={() => handleImageLoaded('wordLogo')}
          alt=""
          width={100}
          height={32}
          id="word-logoo" 
          src="images/Arells-Logo-Ebony.png"/>	        


          <p id="descriptioner">
            ALWAYS SELL
            <span id="ada-description">BITCOIN</span>
            <span id="ada-descriptioner">FOR PROFITS</span>
          </p>

          <BitcoinChart />



          <p id="buy-info-home">    Buy small amounts of Bitcoin.
          <span id="buy-info-homer">Always sell them for Profits.</span>
          </p>

          <Link href="/login" passHref>
            <button id="login">
              LOGIN
            </button>
          </Link> 
   
    </>
  );
}

export default Index;