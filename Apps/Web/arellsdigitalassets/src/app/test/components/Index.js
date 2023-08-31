"use client";

// Change below link after test
import '../../css/Home.css';
import '../../css/modals/copiedlink.css';

//Loader Styles
import '../../css/modals/loading/spinnerBackground.css';
import styles from '../../css/modals/loading/spinner.module.css';

import { useState } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Index = () => {


  //Loader Functions
  const [showLoading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({
    arellsIcon: false,
    wordLogo: false,
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



  useEffect(() => {
    function resetPrototype() {
      sessionStorage.removeItem('walletConnectedSession'); 

      sessionStorage.removeItem('blueOrangeAdded');
      sessionStorage.removeItem('blueOrangePurchased');

      sessionStorage.removeItem('beachHousesAdded');
      sessionStorage.removeItem('beachHousesPurchased');

      sessionStorage.removeItem('colourGlassAdded');
      sessionStorage.removeItem('colourGlassPurchased');

      sessionStorage.removeItem('layersAdded');
      sessionStorage.removeItem('layersPurchased');

      sessionStorage.removeItem('succinctDropAdded');
      sessionStorage.removeItem('succinctDropPurchased');

      sessionStorage.removeItem('paintRainAdded');
      sessionStorage.removeItem('paintRainPurchased');
    }
    
    resetPrototype();
  }, []);

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

      <div id="overlayy">

        <Image 
        onLoad={() => handleImageLoaded('arellsIcon')}
        alt="" 
        width={80}
        height={85}
        id="arells-iconn" 
        src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Icon.png"/>
      
        <br/>
        
        <Image
         onLoad={() => handleImageLoaded('wordLogo')}
         alt=""
         width={120}
         height={40}
         id="word-logoo" 
         src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Logo-Ebony.png"/>	
        
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
          <Link legacyBehavior href="/prototype-seller-created">
            <a id="prototype">PROTOTYPE</a>
          </Link>	        
        </div>           
    
      </div>		       
    </>
  );
}

export default Index;