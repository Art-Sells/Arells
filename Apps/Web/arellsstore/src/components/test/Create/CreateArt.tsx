"use client";

import React from "react";

// asset components
import CreationForm from "./CreationForm";
import useNFTMarket from "../../../state/nft-market";

// Change below link after test
import '../../../app/css/prototype/asset/blue-orange.css';
import '../../../app/css/stayupdated.css';

const CreateArtTest = () => {

// asset functions below
	const { createNFT } = useNFTMarket();
// asset constants above	  
  
	return (
	  <>
		<p id="stay-updated">CREATE</p>
		<br />
		<div id="blue-orange">
			<CreationForm onSubmit={createNFT} />
		</div>
	  </>
	);
  };
  
  export default CreateArtTest;