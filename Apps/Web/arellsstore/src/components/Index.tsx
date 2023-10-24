"use client";

// Assuming that there's no global type definitions for Next.js Image and Link components
import type { ImageLoaderProps } from 'next/image';

"use client";

// Change below link after test
import '../app/css/Home.css';
import '../app/css/modals/copiedlink.css';

// Loader Styles
import '../app/css/modals/loading/spinnerBackground.css';
import styles from '../app/css/modals/loading/spinner.module.css';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

const Index = () => {

  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  }

  // Loader Functions
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
    console.log('Images loaded state:', imagesLoaded);
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
        </div>
      )}
      {showLoading && (
        <div className={styles.spinner}></div>
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
        
        <p id="slogann">ART SELLS</p>
        
        <hr id="black-liner"/>
        
        <p id="descriptioner">
          NEVER LOSE MONEY SELLING ART
        </p>
        
        <hr id="black-liner"/>
        
        <p id="coming-soonn">COMING SOON</p>
    
        {/*<!-- Change below link after test -->*/}
        <Link legacyBehavior href="/stayupdated" >
          <a id="updatess">STAY UPDATED</a>
        </Link>			
        
        <div id="prototype-spacer">
          {/*<!-- Change below link after test -->*/}
          <Link legacyBehavior href="/prototype/seller-created">
            <a id="prototype">PROTOTYPE</a>
          </Link>	        
        </div>                 
    </>
  );
}

export default Index;