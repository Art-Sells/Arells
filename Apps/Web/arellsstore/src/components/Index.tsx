"use client";

import type { ImageLoaderProps } from 'next/image';
import '../app/css/Home.css';
import BitcoinChart from '../components/Bitcoin/BitcoinChart';
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
  };

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
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 2250); // Delay of 2 seconds
  
      return () => clearTimeout(timeoutId); // Clear timeout if component unmounts
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
        src="images/Arells-Logo-Ebony.png"
      />

      <div id="descriptioner-wrapper">
        <p id="descriptioner">Renders bear markets obsolete</p>
      </div>

        {/* <br></br>
        <h5>Currently being upgraded.</h5>
        <h5>Thank you for your patience.</h5>

        <br></br> */}

        <BitcoinChart /> 
        <Link href="/login" passHref>
          <button id="login">LOGIN</button>
        </Link> 

      <div id="buy-info-wrapping">
          <p id="buy-info">
            Import bitcoin and never experience bear market losses.</p>
        </div>

    </>
  );
}

export default Index;
