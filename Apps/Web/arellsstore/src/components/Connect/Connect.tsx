'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { useVavity } from '../../context/VavityAggregator';

import '../../app/css/connect/connect.css';
import '../../app/css/modals/connect/connect-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

const Connect: React.FC = () => {

  const [showCopied, setCopied] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const { email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator } = useVavity();

    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
      return `/${src}?w=${width}&q=${quality || 100}`;
    }
    const [showLoading, setLoading] = useState<boolean>(true);
    const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
      accountLogo: false,
      buyLogo: false,
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
  //Loader Function/s


  const copyToClipboard = () => {
    setCopied(true);
  };

  const closeCopied = () => {
    setCopied(false);
  };

  const handleConnectWallet = async () => {
    setConnectError(null);
    setConnectSuccess(null);

    if (!email) {
      setConnectError('Please sign in first to connect a wallet.');
      return;
    }

    if (!walletAddress.trim()) {
      setConnectError('Wallet address is required');
      return;
    }

    setIsConnecting(true);

    try {
      // Check if wallet address is already connected
      const existingData = await fetchVavityAggregator(email);
      const existingWallets = existingData.wallets || [];
      const addressAlreadyConnected = existingWallets.some(
        (wallet: any) => wallet.address?.toLowerCase() === walletAddress.trim().toLowerCase()
      );

      if (addressAlreadyConnected) {
        setConnectError('This wallet address is already connected. You can connect multiple different wallet addresses.');
        return;
      }

      // Fetch balance from blockchain
      const balanceResponse = await fetch(`/api/balance?address=${walletAddress.trim()}`);
      if (!balanceResponse.ok) {
        throw new Error('Failed to fetch wallet balance');
      }
      const balanceInSatoshis = await balanceResponse.json();
      const balanceInBTC = balanceInSatoshis / 100000000; // Convert satoshis to BTC
      
      if (balanceInBTC <= 0) {
        setConnectError('This wallet has no balance. Please connect a wallet with Bitcoin.');
        return;
      }

      // Get current asset price for calculations
      const currentVapa = Math.max(vapa || 0, assetPrice || 0);
      const currentAssetPrice = assetPrice || currentVapa;
      
      // Initialize wallet data with fetched balance
      const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newCVactTaa = balanceInBTC;
      const newCpVact = currentVapa;
      const newCVact = newCVactTaa * newCpVact;
      const newCVatoi = newCVact; // cVatoi equals cVact at connect time
      const newCpVatoi = currentAssetPrice; // Price at connect time
      const newCdVatoi = newCVact - newCVatoi; // Should be 0 at connect
      
      const walletData = {
        walletId: walletId,
        address: walletAddress.trim(),
        cVatoi: newCVatoi,
        cpVatoi: newCpVatoi,
        cVact: newCVact,
        cpVact: newCpVact,
        cVactTaa: newCVactTaa,
        cdVatoi: newCdVatoi,
      };

      // Add to VavityAggregator
      await addVavityAggregator(email, [walletData]);

      setConnectSuccess(`Wallet connected! Balance: ${balanceInBTC.toFixed(8)} BTC. Your funds have been added to VavityAggregator. You can connect more wallets by entering another address.`);
      
      // Don't clear the input - let user manually clear it or type a new address
      // This ensures the button state updates correctly
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setConnectSuccess(null);
      }, 5000);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setConnectError(error?.message || 'Failed to connect wallet. Please try again.');
    } finally {
      // Always reset connecting state - this ensures button is clickable again
      setIsConnecting(false);
    }
  };

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

      {showCopied && (
        <div id="copied-wrapper">
          <div id="copied-content">
            <Image 
              loader={imageLoader}
              alt="" 
              width={35}
              height={35}
              id="copied-image" 
              src="images/market/address-ivory.png"
            />  
            <p id="copied-words">copied</p>
            <button id="copied-close" onClick={closeCopied}>OK</button> 
          </div>
        </div>
      )}

        <div id="connect-header-navigation">
            <Link href="/account" id="connect-home-link">
              <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('accountLogo')}
                alt=""
                width={23}
                height={23}
                id="connect-account-navigation"
                src="images/howitworks/ArellsIcoIcon.png"
              />
            </Link>							
            <Link href="/buy" id="connect-cart-link">
              <Image
                  loader={imageLoader}
                  onLoad={() => handleImageLoaded('buyLogo')}
                  alt=""
                  width={23}
                  height={23}
                  id="connect-buy-navigation"
                  src="images/howitworks/Bitcoin.png"
                />
            </Link>	
        </div>
                        
        <p id="connect-title">CONNECT</p>
        <div id="connect-instructions-wrapper">
          <p id="connect-instructions">Enter your wallet address to connect and sync your Bitcoin balance
          with Arells. Your funds will be added to VavityAggregator.
          </p>
        </div>
        <div id="bitcoin-address-wrapper">
            <div id="copy-bitcoin-input-wrapper">
            <input 
                id="copy-bitcoin-input"
                type="text" 
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your Bitcoin wallet address"
                disabled={isConnecting}
            />
            <button 
            id="copy-bitcoin-button"
            onClick={handleConnectWallet}
            disabled={isConnecting || !walletAddress.trim()}
            style={{
              cursor: (isConnecting || !walletAddress.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isConnecting || !walletAddress.trim()) ? 0.6 : 1,
            }}
            >
              {isConnecting ? 'CONNECTING...' : 'CONNECT'}
            </button>
            </div>
        </div>
        {connectError && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
            textAlign: 'center',
          }}>
            <strong>Error:</strong> {connectError}
          </div>
        )}
        {connectSuccess && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '5px',
            textAlign: 'center',
          }}>
            <strong>Success:</strong> {connectSuccess}
          </div>
        )}
    </>
  );
};

export default Connect;