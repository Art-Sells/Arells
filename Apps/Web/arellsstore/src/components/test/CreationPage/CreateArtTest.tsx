"use client";

import React from "react";

// asset components
import useSigner from "../../../state/signer";
import CreationForm, { CreationValues } from "./CreationForm";
import useNFTMarket from "../../../state/nft-market";
import { toast } from "react-toastify";

// Change below link after test
import '../../../app/css/prototype/asset/blue-orange.css';
import '../../../app/css/stayupdated.css';
import '../../../app/css/modals/copiedlink.css';
import '../../../app/css/modals/connect-wallet.css';
import '../../../app/css/modals/coming-soon.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';

import Image from 'next/image';

const CreateArtTest = () => {
	const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }): string => {
	  return `/${src}?w=${width}&q=${quality || 100}`;
	};
  
	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [createArtConnected, setCreateArtConnected] = useState(false);

// asset functions below
	const { address, loadingWallet, connectMetamask} = useSigner();
	const { createNFT } = useNFTMarket();
// asset constants above
  
//Submit Nft functions below
	const handleFormSubmit = async (values: CreationValues) => {
		try {
			if (!address){
				setCreateArtConnected(false);	
				setShowConnectWallet(true);
			}
			else if (address) {
				setShowConnectWallet(false);
				setCreateArtConnected(true);
				setLoadingWallet(false);
			}
		} catch (e) {
		  toast.warn("Asset not created.");
		  console.log(e);
		}
	  };
//Submit Nft functions above	  

// Connect Wallet function/s below 
	const [showLoadingWallet, setLoadingWallet] = useState(false);

	const connectWalletFunction = async () => {
		connectMetamask();
		setLoadingWallet(true);
		setShowConnectWallet(false);
    };

	useEffect(() => {
		if (!address){
			setCreateArtConnected(false);	
			setShowConnectWallet(true);
		}
		else if (address) {
			setShowConnectWallet(false);
			setCreateArtConnected(true);
			setLoadingWallet(false);
		}
	}, [address]);
	
// Connect Wallet function/s above  
  
	return (
	  <>
		{showLoadingWallet && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={30}
				height={30}
				id="wallet-loader-icon" 
				src="images/prototype/coinbase-wallet-logo.png"/>        
			</div>
		)}
		{showLoadingWallet && (
			<div className={styles.walletSpinner}></div>
		)}

        {showConnectWallet && (
			<div id="connectWalletBuy">
				<div className="connect-wallet-content">
					<p id="connect-wallet-words">CONNECT WALLET</p>
					<button id="connectWallet"
						onClick={connectWalletFunction}
						disabled={loadingWallet}>
						<Image 
						loader={imageLoader}
						id="wallet-icon"
						alt=""
						width={50}
						height={50}  
						src="images/prototype/coinbase-wallet-logo.png"/>
					</button>		
				</div>
			</div>	  
		)}   

		 {createArtConnected && (
			<div>
				<p id="stay-updated">CREATE</p>
				<br />
				<div id="blue-orange">
		 		 <CreationForm onSubmit={handleFormSubmit} />
				</div>
			</div>
		)}
	  </>
	);
  };
  
  export default CreateArtTest;