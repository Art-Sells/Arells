"use client";

// Change below link after test
import '../../app/css/Home.css';
import '../../app/css/modals/copiedlink.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

import { useState } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Error = () => {


  //Loader Functions
  const [showLoading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({
    arellsIcon: false,
  });
  const handleImageLoaded = (imageName) => {
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
            alt="" 
            width={29}
            height={30}
            id="arells-loader-icon" 
            src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Icon.png"/>        
        </div>
      )}
      {showLoading && (
        <div className={styles.spinner}></div>
      )}

        <Image 
        onLoad={() => handleImageLoaded('arellsIcon')}
        alt="" 
        width={80}
        height={85}
        id="arells-iconn" 
        src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Icon.png"/>
        
        <br/>
        
        <p id="slogann">Page Cannot Be Found</p>
        
        <hr id="black-liner"/>
    
        {/*<!-- Change below link after test -->*/}
        <Link legacyBehavior href="https://arells.com" >
          <a id="updatess">BACK TO HOME</a>
        </Link>			

    </>
  );
}

export default Error;