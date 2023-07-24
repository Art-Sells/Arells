"use client";

// Change below link after test
import '../css/prototype/buyer-collected.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const prototypeBuyerCollected = () => {

	const [elementId, setElementId] = useState('');

	useEffect(() => {
		// Set the id prop here; this code will only execute on the client-side
		setElementId('prototype-buyer-collected-word');
	}, []);



	

{/*<!-- useState constants below -->*/}
	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkBuyerCollected, setCartLinkBuyerCollected] = useState(true);
	const [walletConnectedDivBuyerCollected, setWalletConnectedDivBuyerCollected] = useState(false);
	const [cartLinkFullBuyerCollected, setCartLinkFullBuyerCollected] = useState(false);

	const [cartLinkConnectedBuyerCollected, setCartLinkConnectedBuyerCollected] = useState(false);

	const [noArtBuyerCollected, setNoArtBuyerCollected] = useState(true);
	const [collectedItemsBuyerCollected, setCollectedItemsBuyerCollected] = useState(false);

	const[blueOrangeBuyerCollected, setBlueOrangeBuyerCollected] = useState(false);
	const[beachHousesBuyerCollected, setBeachHousesBuyerCollected] = useState(false);
	const[colourGlassBuyerCollected, setColourGlassBuyerCollected] = useState(false);
	const[layersBuyerCollected, setLayersBuyerCollected] = useState(false);
	const[succinctDropBuyerCollected, setSuccinctBuyerCollected] = useState(false);
	const[paintRainBuyerCollected, setPaintRainBuyerCollected] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype-buyer-collected'}`);
	}, [router.asPath]);
	const copyLink = () => {
		navigator.clipboard.writeText(fullUrl).then(() => {
			setCopiedLink(true);
		  });
	};
  
	const closeCopiedLink = () => {
	  setCopiedLink(false);
	};
{/*<!-- Copy Links function/s above -->*/}


{/*<!-- Connect Wallet function/s below -->*/}
	const connectWallet = () => {
		setShowConnectWallet(true);
	};

	const walletConnected = () => {
		setShowConnectWallet(false);
		
		setCartLinkBuyerCollected(false);
		setWalletConnectedBuyerCollected(true);
		
		setCartLinkConnectedBuyerCollected(true);
		
		sessionStorage.setItem('walletConnectedSession', 'true');
		setWalletConnectedSession('true');
	}	
	
	const [walletConnectedSession, setWalletConnectedSession] = useState(null);
	useEffect(() => {
	  const sessionValue = sessionStorage.getItem('walletConnectedSession');
	  setWalletConnectedSession(sessionValue);
	}, []);
	useEffect(() => {
		if (walletConnectedSession === 'true') {
			setCartLinkBuyerCollected(false);
			setWalletConnectedDivBuyerCollected(true);
			
			setCartLinkConnectedBuyerCollected(true);
		}
	}, [walletConnectedSession]);
{/*<!-- Connect Wallet function/s above -->*/}

{/*<!-- Added/Purchased To function/s below -->*/}
	const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
	const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
	const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
	const layersAdded = sessionStorage.getItem('layersAdded');
	const paintRainAdded = sessionStorage.getItem('paintRainAdded');
	const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');

	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded == 'true') {
			setCartLinkConnectedBuyerCollected(false);
			setCartLinkFullBuyerCollected(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);

	const blueOrangePurchased = sessionStorage.getItem('blueOrangePurchased');
	const beachHousesPurchased = sessionStorage.getItem('beachHousesPurchased');
	const colourGlassPurchased = sessionStorage.getItem('colourGlassPurchased');
	const layersPurchased = sessionStorage.getItem('layersPurchased');
	const paintRainPurchased = sessionStorage.getItem('paintRainPurchased');
	const succinctDropPurchased = sessionStorage.getItem('succinctDropPurchased');	

	useEffect(() => {
		if (blueOrangePurchased === 'true') {
			setNoArtBuyerCollected(false);

			setCollectedItemsBuyerCollected(true);
			setBlueOrangeBuyerCollected(true);
		}
	}, [blueOrangePurchased]);
	useEffect(() => {
		if (beachHousesPurchased === 'true') {
			setNoArtBuyerCollected(false);

			setCollectedItemsBuyerCollected(true);
			setBeachHousesBuyerCollected(true);
		}
	}, [beachHousesPurchased]);
	useEffect(() => {
		if (colourGlassPurchased === 'true') {
			setNoArtBuyerCollected(false);

			setCollectedItemsBuyerCollected(true);
			setColourGlassBuyerCollected(true);
		}
	}, [colourGlassPurchased]);
	useEffect(() => {
		if (layersPurchased === 'true') {
			setNoArtBuyerCollected(false);

			setCollectedItemsBuyerCollected(true);
			setLayersBuyerCollected(true);
		}
	}, [layersPurchased]);
	useEffect(() => {
		if (paintRainPurchased === 'true') {
			setNoArtBuyerCollected(false);

			setCollectedItemsBuyerCollected(true);
			setPaintRainBuyerCollected(true);
		}
	}, [paintRainPurchased]);
	useEffect(() => {
		if (succinctDropPurchased === 'true') {
			setNoArtBuyerCollected(false);

			setCollectedItemsBuyerCollected(true);
			setSuccinctDropBuyerCollected(true);
		}
	}, [succinctDropPurchased]);
	
{/*<!-- Added/Purchased To function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Buyer Collections Prototype"/>
			<meta name="description" content="Prototype for Buyer Collections"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-buyer-collected"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>	
			<meta property="og:site_name" content="Arells"/>	
			<meta property="og:type" content="website"/>				
			<meta property="og:title" content="Buyer Collections Prototype"/>
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-buyer-collected"/>
			<meta property="og:description" content="Prototype for Buyer Collections"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Buyer Collections Prototype"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-buyer-collected"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Prototype for Buyer Collections"/>
		</Head>

		<title>Prototype Buyer Collected</title>	

{/*<!-- Modals below link after test -->*/}
		{showCopiedLink && (
			<div id="copiedLink">
				<div className="modal-content">
				<p>LINK COPIED</p>
				<button className="close"
					onClick={closeCopiedLink}>OK</button>	
				</div>
			</div>	
		)}

		{showConnectWallet && (
			<div id="connectWalletBuy">
				<div className="connect-wallet-content">
					<p id="connect-wallet-words">CONNECT WALLET</p>
					<button id="connectWallet"
						onClick={walletConnected}>
						<img id="wallet-icon" src="/icons&images/prototype/coinbase-wallet-logo.png"/>
					</button>		
				</div>
			</div>	
		)}
{/*<!-- Modals Above -->*/}


		<div id="prototype-buyer-collected-wrapper">
			<div id="header-buyer-collected">
			
			{/*<!-- Change Link Below After Test -->*/}
				<Link legacuBehavior href="/">
					<a id="icon-link-buyer-collected">
						<img id="arells-icon-buyer-collected" src="/icons&images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>	
				{cartLinkBuyerCollected && (
					<button id="cart-link-buyer-collected" onClick="connectWallet()">
						<img id="cart-icon-buyer-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
					</button>					
				)}
				{cartLinkConnectedBuyerCollected && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-connected-buyer-collected">
							<img id="cart-icon-buyer-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>
				
				)}
				{cartLinkFullBuyerCollected && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-full-buyer-collected">
							<img id="cart-icon-buyer-collected" src="/icons&images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>
				
				)}		
			</div>
			<img id="word-logo-buyer-collected" src="/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-buyer-collected">ART SELLS</p>
			{walletConnectedDivBuyerCollected && (
				<div id="wallet-connected-div-buyer-collected">
					<hr id="connected-line-buyer-collected"/>
					<p id="wallet-connected-buyer-collected" >
					WALLET CONNECTED</p>
					<hr id="connected-line-buyer-collected"/>
				</div>				
			)}
			<div id="profile-img-container-buyer-collected">
				<img id="profile-photo-buyer-collected" src="/icons&images/prototype/Unnamed-Icon.jpg"/>
			</div>	 
			<h1 id="name-buyer-collected">Unnamed</h1>  
			<p id="description-buyer-collected">Creator & Collector</p> 
			<div id="share-div">
				<p id="share-div-desc">SHARE</p>
				<button id="copy-link-buyer-collected"
					onClick="copyLink()">
					<img id="copy-link-icon-buyer-collected" src="/icons&images/prototype/link.png"/>
					COPY LINK</button>	
			</div>		
			<hr id="profileline-buyer-collected"/>
			<div id="created-collected-buyer-collected">
				{/*<!-- Change Link Below After Test -->*/}
				<Link legacyBehavior href="/prototype-buyer-created">
					<a id="created-buyer-collected">Created</a>		
				</Link>
				<a id="collected-buyer-collected">Collected</a>	
			</div>
			{noArtBuyerCollected && (
				<p id="no-art-buyer-collected">
					no art collected
					<img id="cart-icon-collected-buyer-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
				</p>
			)}
			{collectedItemsBuyerCollected && (
				<div id="collected-items-buyer-collected">
					{blueOrangeBuyerCollected && (
						<div id="blue-orange-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype-blue-orange">
								<a target="_self" id="photo-link-buyer-collected">
									<img id="photo-buyer-collected" src="/icons&images/prototype/1.jpg"/>
								</a>								
							</Link>
							<div id="prices-buyer-collected">
								<div id="blue-orange-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-blue-orange-after-buyer-collected">$3,000,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-blue-orange-after-buyer-collected">$60,000</p>
								</div>			  		
							</div>		  		
						</div>
					)}
					{beachHousesBuyerCollected && (
						<div id="beach-houses-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype-beach-houses">
								<a target="_self" id="photo-link-buyer-collected">
									<img id="photo-buyer-collected" src="/icons&images/prototype/2.jpg"/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="beach-houses-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-beach-houses-after-buyer-collected">$500,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-beach-houses-after-buyer-collected">$10,000</p>
								</div>			  		
							</div>     	
						</div>
					)}
					{colourGlassBuyerCollected && (
						<div id="colour-glass-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype-colour-glass">
								<a target="_self" id="photo-link-buyer-collected">
									<img id="photo-buyer-collected" src="/icons&images/prototype/3.jpg"/>
								</a>								
							</Link>
							<div id="prices-buyer-collected">
								<div id="colour-glass-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-colour-glass-after-buyer-collected">$36,250,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-colour-glass-after-buyer-collected">$725,000</p>
								</div>  		  		
							</div>   	
						</div>
					)}
					{layersBuyerCollected && (
						<div id="layers-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype-layers">
								<a target="_self" id="photo-link-buyer-collected">
									<img id="photo-buyer-collected" src="/icons&images/prototype/4.jpg"/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="layers-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-layers-after-buyer-collected">$1,000,000,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-layers-after-buyer-collected">$20,000,000</p>
								</div>		  		
							</div>
						</div>
					)}
					{succinctDropBuyerCollected && (
						<div id="succinct-drop-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype-succinct-drop">
								<a target="_self" id="photo-link-buyer-collected">
									<img id="photo-buyer-collected" src="/icons&images/prototype/5.jpg"/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="succinct-drop-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-succinct-drop-after-buyer-collected">$250,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-succinct-drop-after-buyer-collected">$5,000</p>
								</div>				  		
							</div>     	
						</div>
					)}
					{paintRainBuyerCollected && (
						<div id="paint-rain-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype-paint-rain">
								<a target="_self" id="photo-link-buyer-collected">
									<img id="photo-buyer-collected" src="/icons&images/prototype/6.jpg"/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="paint-rain-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-paint-rain-after-buyer-collected">$30,000,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-paint-rain-after-buyer-collected">$600,000</p>
								</div>			  		
							</div>     	
						</div>
					)}
				</div>
			)}

				<p id={elementId}>PROTOTYPE</p>
		</div>			
		     
        </>
    );
}

export default prototypeBuyerCollected;