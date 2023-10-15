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

import { useState } from 'react';

import Image from 'next/image';

const CreateArtTest = () => {
	const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }): string => {
	  return `/${src}?w=${width}&q=${quality || 100}`;
	};
  
	const [showConnectWallet, setShowConnectWallet] = useState(false);

// asset functions below
	const { address, loadingWallet, connectMetamask} = useSigner();
	const { createNFT } = useNFTMarket();
// asset constants above
  
//Submit Nft functions below
	const handleFormSubmit = async (values: CreationValues) => {
		try {

		} catch (e) {
		  toast.warn("Asset not created.");
		  console.log(e);
		}
	  };
//Submit Nft functions above	  
  
	return (
	  <>
		<p id="stay-updated">CREATE</p>
		<br />
		<div id="blue-orange">
			<CreationForm onSubmit={handleFormSubmit} />
		</div>
	  </>
	);
  };
  
  export default CreateArtTest;