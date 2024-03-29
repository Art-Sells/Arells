"use client";

// Assuming that there's no global type definitions for Next.js Image and Link components
import type { ImageLoaderProps } from 'next/image';

"use client";

// Change below link after test
import '../app/css/Home.css';

// Loader Styles
import '../app/css/modals/loading/spinnerBackground.css';
import styles from '../app/css/modals/loading/spinner.module.css';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import React from 'react';
import useSigner from '../state/signer';
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



// asset functions below
    const [openStore, setOpenStore] = useState(false);
    const [openStoreConnected, setOpenStoreConnected] = useState(false);
    const { address, connectWallet } = useSigner();
    const [isConnecting, setIsConnecting] = useState(false);
    const handleConnectWallet = async () => {
      setIsConnecting(true);
      try {
        await connectWallet();
        if (address) {
          // If address is set, it means wallet is connected
          setOpenStore(false);
          setOpenStoreConnected(true);
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
      } finally {
        setIsConnecting(false);
      }
    };
    useEffect(() => {
      if (!address) {
        setOpenStore(true);
        setOpenStoreConnected(false);
      }
      else {
        setOpenStore(false);
        setOpenStoreConnected(true);
      }
    }, [address]);
    
// Asset functions anove    

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
      {openStoreConnected && (
        <div id="connected-spacing"></div>
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
        
      {openStore && (
        <div>          
          <p id="descriptioner">
          BUY ART THAT NEVER LOSES VALUE
          </p>

          <hr id="black-liner"/>

          <p id="ada-description">
          ARELLS DIGITAL ASSETS
          </p>

          <hr id="black-liner-bottom-home"/>

          <p id="bear-markets-description">
          NO MORE BEAR MARKETS
          </p>            
          <button 
          id="updatess" 
          onClick={handleConnectWallet}
          disabled={isConnecting} 
          >
            {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
          </button> 
          <p id="wallet-needed-words">Connect Wallet to Enter Your Store</p>
        </div>
  
      )}	
      {openStoreConnected && (
        <div id="connecting-wallet-wrapper">
          <p id="ada-connected">
          WALLET CONNECTED
          </p>
          {/* change below link after test */}
          <Link href={`/own/${address}`} passHref>
            <button id="updatess-connected">
              ENTER STORE
            </button>
          </Link> 
        </div>  
      )}	
      <br></br>

      <Link 
      href="https://discord.gg/6UUJxepDx7" 
      passHref
      id="discord-wrapper">
        <Image 
          loader={imageLoader}
          onLoad={() => handleImageLoaded('arellsIcon')}
          alt="" 
          width={25}
          height={25}
          id="discord-icon" 
          src="images/discord.png"/>	
      </Link>     
    </>
  );
}

export default Index;