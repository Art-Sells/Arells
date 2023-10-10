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

import { useEffect, useState } from 'react';

import Image from 'next/image';

const CreateArtTest = () => {
	const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }): string => {
	  return `/${src}?w=${width}&q=${quality || 100}`;
	};
  
	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [createArtConnected, setCreateArtConnected] = useState(true);
  
	const { connectMetamask } = useSigner();
	const { createNFT } = useNFTMarket();
  
	const handleFormSubmit = async (values: CreationValues) => {
		try {
		  await createNFT(values);
		  toast.success("You'll see your new NFT here shortly. Refresh the page.");
		} catch (e) {
		  toast.warn("Something wrong!");
		  console.log(e);
		}
	  };
  
	const [walletConnectedSession, setWalletConnectedSession] = useState<string | null>(null);
  
	useEffect(() => {
	  const sessionValue = sessionStorage.getItem('walletConnectedSession');
	  setWalletConnectedSession(sessionValue);
	}, []);
  
	useEffect(() => {
	  if (walletConnectedSession === 'true') {
		setShowConnectWallet(false);
		setCreateArtConnected(true);
	  } else {
		setShowConnectWallet(true);
		setCreateArtConnected(false);
	  }
	}, [walletConnectedSession]);
  
	const connectWalletFunction = async () => {
	  await connectMetamask();
	  setShowConnectWallet(false);
	  setCreateArtConnected(true);
  
	  sessionStorage.setItem('walletConnectedSession', 'true');
	  setWalletConnectedSession('true');
	};
  
	return (
	  <>
		{showConnectWallet && (
		  <div id="connectWalletBuy">
			<div className="connect-wallet-content">
			  <p id="connect-wallet-words">CONNECT WALLET</p>
			  <button id="connectWallet" onClick={connectWalletFunction}>
				<Image
				  loader={imageLoader}
				  id="wallet-icon"
				  alt=""
				  width={50}
				  height={50}
				  src="images/prototype/coinbase-wallet-logo.png"
				/>
			  </button>
			</div>
		  </div>
		)}
  
		<p id="stay-updated">CREATE</p>
  
		<br />
  
		<div id="blue-orange">
		  {createArtConnected && <CreationForm onSubmit={handleFormSubmit} />}
		</div>
	  </>
	);
  };
  
  export default CreateArtTest;