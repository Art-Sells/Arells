"use client";

import React from "react";

// asset components
import CreationForm, { CreationValues } from "./CreationForm";
import useNFTMarket from "../../../state/nft-market";
import { toast } from "react-toastify";

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