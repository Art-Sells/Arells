'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useVavity } from '../../context/VavityAggregator';
import { connectWallet, WalletType } from '../../utils/walletConnection';

import '../../app/css/connect/connect.css';
import '../../app/css/modals/connect/connect-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

const Connect: React.FC = () => {

  const [showCopied, setCopied] = useState<boolean>(false);
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState<boolean>(false);
  const [isConnectingBase, setIsConnectingBase] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);
  const { email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator } = useVavity();

  // Clear connected address on mount to ensure fresh connection
  useEffect(() => {
    setConnectedAddress('');
  }, []);

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

  // Helper function to connect a wallet (uses shared wallet connection infrastructure)
  const handleWalletConnection = async (walletType: WalletType) => {
    setConnectError(null);
    setConnectSuccess(null);
    setConnectedAddress(''); // Clear previous address

    if (!email) {
      setConnectError('Please sign in first to connect a wallet.');
      return;
    }

    // Set the appropriate connecting state
    if (walletType === 'metamask') {
      setIsConnectingMetaMask(true);
    } else {
      setIsConnectingBase(true);
    }

    try {
      console.log(`Requesting ${walletType} wallet connection...`);
      
      // Use the shared wallet connection infrastructure
      const { accounts } = await connectWallet(walletType);
      
      console.log('Accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        setConnectError(`No accounts found. Please approve the connection in ${walletType === 'metamask' ? 'MetaMask' : 'Base'}.`);
        if (walletType === 'metamask') {
          setIsConnectingMetaMask(false);
        } else {
          setIsConnectingBase(false);
        }
        return;
      }

      const walletAddress = accounts[0];
      console.log('Wallet address from request:', walletAddress);

      console.log('Checking if wallet already connected...');
      
      // Check if wallet address is already connected
      const existingData = await fetchVavityAggregator(email);
      const existingWallets = existingData.wallets || [];
      const addressAlreadyConnected = existingWallets.some(
        (wallet: any) => wallet.address?.toLowerCase() === walletAddress.toLowerCase()
      );

      if (addressAlreadyConnected) {
        setConnectError('This wallet address is already connected. You can connect multiple different wallet addresses.');
        if (walletType === 'metamask') {
          setIsConnectingMetaMask(false);
        } else {
          setIsConnectingBase(false);
        }
        setConnectedAddress(''); // Clear address on error
        return;
      }

      console.log('Fetching Bitcoin balance...');
      
      // Fetch Bitcoin balance from blockchain (via Ethereum network)
      const balanceResponse = await fetch(`/api/ethBalance?address=${walletAddress}`);
      if (!balanceResponse.ok) {
        const errorData = await balanceResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch wallet balance');
      }
      const balanceData = await balanceResponse.json();
      const balanceInBTC = parseFloat(balanceData.balance);
      
      console.log('Balance fetched:', balanceInBTC);
      
      if (balanceInBTC <= 0) {
        setConnectError('This wallet has no balance. Please connect a wallet with Bitcoin.');
        if (walletType === 'metamask') {
          setIsConnectingMetaMask(false);
        } else {
          setIsConnectingBase(false);
        }
        setConnectedAddress(''); // Clear address on error
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
        address: walletAddress,
        cVatoi: newCVatoi,
        cpVatoi: newCpVatoi,
        cVact: newCVact,
        cpVact: newCpVact,
        cVactTaa: newCVactTaa,
        cdVatoi: newCdVatoi,
      };

      console.log('Adding wallet to VavityAggregator...');
      
      // Add to VavityAggregator
      await addVavityAggregator(email, [walletData]);

      console.log('Wallet added successfully!');
      
      // Only set connected address AFTER successful connection
      setConnectedAddress(walletAddress);
      
      setConnectSuccess(`${walletType === 'metamask' ? 'MetaMask' : 'Base'} wallet connected! Balance: ${balanceInBTC.toFixed(6)} BTC. Your funds have been added to VavityAggregator.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setConnectSuccess(null);
      }, 5000);
    } catch (error: any) {
      console.error(`Error connecting ${walletType} wallet:`, error);
      const errorMessage = error?.message || `Failed to connect ${walletType === 'metamask' ? 'MetaMask' : 'Base'} wallet. Please try again.`;
      setConnectError(errorMessage);
      setConnectedAddress(''); // Clear address on error
    } finally {
      // Always reset connecting state - this ensures button is clickable again
      console.log('Resetting connecting state');
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
    }
  };

  const handleConnectMetaMask = () => {
    handleWalletConnection('metamask');
  };

  const handleConnectBase = () => {
    handleWalletConnection('base');
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
          <p id="connect-instructions">Click one of the buttons below to connect your wallet. A popup will appear asking you to connect your wallet.
          </p>
        </div>
        <div id="bitcoin-address-wrapper">
            <div id="copy-bitcoin-input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
            id="copy-bitcoin-button"
            onClick={handleConnectMetaMask}
            disabled={isConnectingMetaMask || isConnectingBase}
            style={{
              cursor: (isConnectingMetaMask || isConnectingBase) ? 'not-allowed' : 'pointer',
              opacity: (isConnectingMetaMask || isConnectingBase) ? 0.6 : 1,
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#f6851b',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
            >
              {isConnectingMetaMask ? 'CONNECTING METAMASK...' : 'CONNECT METAMASK'}
            </button>
            <button 
            id="copy-bitcoin-button"
            onClick={handleConnectBase}
            disabled={isConnectingMetaMask || isConnectingBase}
            style={{
              cursor: (isConnectingMetaMask || isConnectingBase) ? 'not-allowed' : 'pointer',
              opacity: (isConnectingMetaMask || isConnectingBase) ? 0.6 : 1,
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#0052ff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
            >
              {isConnectingBase ? 'CONNECTING BASE...' : 'CONNECT BASE'}
            </button>
            {connectedAddress && !isConnectingMetaMask && !isConnectingBase && (
              <div style={{
                padding: '10px',
                marginTop: '10px',
                backgroundColor: '#e9ecef',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                textAlign: 'center',
              }}>
                Connected: {connectedAddress}
              </div>
            )}
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