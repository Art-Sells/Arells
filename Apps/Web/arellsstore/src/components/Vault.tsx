"use client";

// Assuming that there's no global type definitions for Next.js Image and Link components
import type { ImageLoaderProps } from 'next/image';

"use client";

// Change below link after test
import '../app/css/Home.css';
import '../app/css/modals/copiedlink.css';

// Loader Styles
import '../app/css/modals/loading/spinnerBackground.css';

import { useState, useEffect } from 'react';
import useNFTMarket from '../state/nft-market'
import React from 'react';
import useSigner from '../state/signer';
import Link from 'next/link';

const Vault = () => {
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
    console.log('Images loaded state:', imagesLoaded);
    if (Object.values(imagesLoaded).every(Boolean)) {
      setLoading(false);
    }
  }, [imagesLoaded]);



// vault connection functions below
    const [openVault, setOpenVault] = useState(true);
    const [openVaultConnected, setOpenVaultConnected] = useState(false);
    const { address, connectWallet } = useSigner();
    const {withdrawFunds} = useNFTMarket(address ?? null);
    useEffect(() => {
      if (address) {
        setOpenVault(false);
        setOpenVaultConnected(true);
      }
      else if (!address) {
        setOpenVault(true);
        setOpenVaultConnected(false);
      }
    }, [address]);
// vault connection functions anove    

  return (
    <>
        {openVault && (
          <button id="updatess" onClick={connectWallet}>
            OPEN VAULT
          </button>     
		)}	
		{openVaultConnected && (
          <button id="updatess" onClick={withdrawFunds}>
            ENTER VAULT
          </button> 
		)}		  
    </>
  );
}

export default Vault;