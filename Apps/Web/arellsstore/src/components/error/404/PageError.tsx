"use client";

// Change below link after test
import '../../../app/css/error-style.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image, { ImageLoaderProps } from 'next/image';

const PageError: React.FC = () => {

  const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
		return `/${src}?w=${width}&q=${quality || 100}`
	  }

  //Loader Functions
  const [showLoading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({
    arellsIcon: false,
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
        onLoad={() => handleImageLoaded('arellsIcon')}
        alt="" 
        width={40}
        height={42}
        id="arells-icon-error" 
        src="images/Arells-Icon.png"/>
        
        <br/>
        
        <p id="error-message">PAGE NOT FOUND</p>
    
        {/* Change below link after test */}
        <Link legacyBehavior href="https://arells.com">
          <a id="back-to-home">BACK TO HOME</a>
        </Link>			
    </>
  );
}

export default PageError;
