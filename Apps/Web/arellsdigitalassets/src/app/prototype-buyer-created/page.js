"use client";

// Change below link after test
import '../css/prototype/buyer-created.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';

import Head from 'next/head'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const prototypeBuyerCreated = () => {

{/*<!-- useState constants below -->*/}
	const [showCopiedLink, setCopiedLink] = useState(false);
		
	const [cartLinkBuyerCreated, setCartLinkBuyerCreated] = useState(true);
	const [cartLinkConnectedBuyerCreated, setCartLinkConnectedBuyerCreated] = useState(false);
	const [cartLinkFullBuyerCreated, setCartLinkFullBuyerCreated] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivBuyerCreated, setWalletConnectedDivBuyerCreated] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype-buyer-created'}`);
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
		
		setCartLinkBuyerCreated(false);
		setWalletConnectedDivBuyerCreated(true);
		
		setCartLinkConnectedBuyerCreated(true);
		
		sessionStorage.setItem('walletConnectedSession', 'true');
		setWalletConnectedSession('true');
	};	
	
	const [walletConnectedSession, setWalletConnectedSession] = useState(null);
	useEffect(() => {
	  const sessionValue = sessionStorage.getItem('walletConnectedSession');
	  setWalletConnectedSession(sessionValue);
	}, []);
	useEffect(() => {
		if (walletConnectedSession === 'true') {
			setCartLinkBuyerCreated(false);
			setWalletConnectedDivBuyerCreated(true);
			
			setCartLinkConnectedBuyerCreated(true);
		}
	}, [walletConnectedSession]);
{/*<!-- Connect Wallet function/s above -->*/}

{/*<!-- Add To Cart function/s below -->*/}

	const [blueOrangeAdded, setBlueOrangeAdded] = useState(null);
	const [beachHousesAdded, setBeachHousesAdded] = useState(null);
	const [colourGlassAdded, setColourGlassAdded] = useState(null);
	const [layersAdded, setLayersAdded] = useState(null);
	const [paintRainAdded, setPaintRainAdded] = useState(null);
	const [succinctDropAdded, setSuccinctDropAdded] = useState(null);
	useEffect(() => {
		const blueOrangeSession = sessionStorage.getItem('blueOrangeAdded');
		const beachHousesSession = sessionStorage.getItem('beachHousesAdded');
		const colourGlassSession = sessionStorage.getItem('colourGlassAdded');
		const layersSession = sessionStorage.getItem('layersAdded');
		const paintRainSession = sessionStorage.getItem('paintRainAdded');
		const succinctDropSession = sessionStorage.getItem('succinctDropAdded');
		setBlueOrangeAdded(blueOrangeSession);
		setBeachHousesAdded(beachHousesSession);
		setColourGlassAdded(colourGlassSession);
		setLayersAdded(layersSession);
		setPaintRainAdded(paintRainSession);
		setSuccinctDropAdded(succinctDropSession);
	}, []);
	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedBuyerCreated(false);
			setCartLinkFullBuyerCreated(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);	

{/*<!-- Add To Cart function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Buyer Creations Prototype" />
			<meta name="description" content="Prototype for Buyer Creations" />
			<meta name="google" content="nositelinkssearchbox" />
			<meta name="keywords" content="Arells" />
			<meta name="author" content="Arells" />
			<meta name="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-buyer-created" />

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg" />
			<meta property="og:site_name" content="Arells" />
			<meta property="og:type" content="website" />
			<meta property="og:title" content="Buyer Creations Prototype" />
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-buyer-created" />
			<meta property="og:description" content="Prototype for Buyer Creations" />
			<meta property="og:image:type" content="image/jpg" />
			<meta property="og:image:width" content="700" />
			<meta property="og:image:height" content="400" />

			<meta name="twitter:title" content="Buyer Creations Prototype" />
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg" />
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-buyer-created" />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:description" content="Prototype for Buyer Creations" />
		</Head>

		<title>Prototype Buyer Creations</title>	

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


		<div id="prototype-buyer-created-wrapper">
				<div id="header-buyer-created">
			
			{/*<!-- Change below link after test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-buyer-created">
						<img id="arells-icon-buyer-created" src="/icons&images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>							
				{cartLinkBuyerCreated && (
					<button id="cart-link-buyer-created" onClick={connectWallet}>
						<img id="cart-icon-buyer-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedBuyerCreated && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-connected-buyer-created">
							<img id="cart-icon-buyer-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}		
				{cartLinkFullBuyerCreated && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-full-buyer-created">
							<img id="cart-icon-buyer-created" src="/icons&images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>	
				)}	
			</div>
			<img id="word-logo-buyer-created" src="/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-buyer-created">ART SELLS</p>
			{walletConnectedDivBuyerCreated && (
				<div id="wallet-connected-div-buyer-created">
					<hr id="connected-line-buyer-created"/>
					<p id="wallet-connected-buyer-created" >
					WALLET CONNECTED</p>
					<hr id="connected-line-buyer-created"/>
				</div>
			)}	
			<div id="profile-img-container-buyer-created">
				<img id="profile-photo-buyer-created" src="/icons&images/prototype/Unnamed-Icon.jpg"/>
			</div>	 
			<h1 id="name-buyer-created">Unnamed</h1>  
			<p id="description-buyer-created">Creator & Collector</p> 
			<div id="share-div-buyer-created">
				<p id="share-div-desc-buyer-created">SHARE</p>
				<button id="copy-link-buyer-created"
				onClick={copyLink}>
					<img id="copy-link-icon-buyer-created" src="/icons&images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-buyer-created"/>
			<div id="created-collected-buyer-created">
				<a id="created-buyer-created">Created</a>	
				{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/prototype-buyer-collected">
					<a id="collected-buyer-created" >Collected</a>		
				</Link>	
			</div>
			<p id="no-art-buyer-created">
				no art created
				<img id="cart-icon-collected-buyer-created" src="/icons&images/prototype/Add.png"/>
			</p>

		</div>			
		     
        </>
    );
}

export default prototypeBuyerCreated;