"use client";

import React from "react";

// asset components
import CreationForm from "./CreationForm";
import useNFTMarket from "../../state/nft-market";

// Change below link after test
import '../../app/css/prototype/asset/asset.css';
import '../../app/css/stayupdated.css';
import useSigner from "../../state/signer";

const CreateArt = () => {

// asset functions below
const { address } = useSigner();
const safeAddress = address || null;
const { createNFT } = useNFTMarket(safeAddress);
// asset constants above	  
  
	return (
	  <>
		<p id="stay-updated">CREATE TO SELL</p>
		<br />
		<div id="blue-orange">
			<CreationForm onSubmit={createNFT} />
		</div>
	  </>
	);
  };
  
  export default CreateArt;