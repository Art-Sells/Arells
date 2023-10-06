"use client";

import React from "react";

// asset components
import useSigner from "../../../../state/signer";
import CreationForm from "./CreationForm";
import useNFTMarket from "../../../../state/nft-market";

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

	const imageLoader = ({ src, width, quality }) => {
        return `/${src}?w=${width}&q=${quality || 100}`
    }


{/*<!-- useState constants below -->*/}
	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [createArtConnected, setCreateArtConnected] = useState(true);
{/*<!-- useState constants above -->*/}

{/*<!-- asset functions below -->*/}
	const {connectMetamask} = useSigner();
	const {createNFT} = useNFTMarket();

	const handleFormSubmit = async (data) => {
        try {
            const metadata = await createNFT({
                name: data.name,
                image: data.image
            });

            console.log('Stored asset metadata:', metadata);
        } catch (error) {
            console.error('Error while creating NFT:', error);
        }
    };

{/*<!-- asset functions above -->*/}

{/*<!-- Connect Wallet function/s below -->*/}

	const [walletConnectedSession, setWalletConnectedSession] = useState(null);
	useEffect(() => {
	const sessionValue = sessionStorage.getItem('walletConnectedSession');
	setWalletConnectedSession(sessionValue);
	}, []);
	useEffect(() => {
		if (walletConnectedSession === 'true') {
			setShowConnectWallet(false);   
			setCreateArtConnected(true);    
		}
		else {
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

{/*<!-- Connect Wallet function/s above -->*/}
	
    return (
        <>

{/*<!-- Modals below link after test -->*/}

		{showConnectWallet && (
			<div id="connectWalletBuy">
				<div className="connect-wallet-content">
					<p id="connect-wallet-words">CONNECT WALLET</p>
					<button id="connectWallet"
						onClick={connectWalletFunction}>
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

{/*<!-- Modals Above -->*/}      

			<p id="stay-updated">CREATE</p> 
			
			<br/>							
			
            <div id="blue-orange">  
				{createArtConnected && (
					<CreationForm onSubmit={handleFormSubmit}/>
				)} 
            </div>  
        </>
    );
}

export default CreateArtTest;