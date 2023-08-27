"use client";

// Change below link after test
import '../css/prototype/buyer-created.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';

import Head from 'next/head'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const PrototypeBuyerCreated = () => {

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
						<Image 
						id="wallet-icon"
						alt=""
						width={50}
						height={50}  
						 src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/coinbase-wallet-logo.png"/>
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
						<Image
						alt=""
						height={16}
						width={15}
						id="arells-icon-buyer-created" 
						src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>							
				{cartLinkBuyerCreated && (
					<button id="cart-link-buyer-created" onClick={connectWallet}>
						<Image
						alt=""
						height={15}
						width={16} 
						id="cart-icon-buyer-created" 
						src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedBuyerCreated && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-connected-buyer-created">
							<Image
							alt=""
							height={15}
							width={16}
							id="cart-icon-buyer-created" 
							src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}		
				{cartLinkFullBuyerCreated && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-full-buyer-created">
							<Image
							alt=""
							height={15}
							width={16} 
							id="cart-icon-buyer-created" 
							src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>	
				)}	
			</div>
			<Image
			alt=""
			width={110}  
			height={35} 
			id="word-logo-buyer-created" 
			src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-buyer-created">NEVER LOSE MONEY SELLING ART</p>
			{walletConnectedDivBuyerCreated && (
				<div id="wallet-connected-div-buyer-created">
					<hr id="connected-line-buyer-created"/>
					<p id="wallet-connected-buyer-created" >
					WALLET CONNECTED</p>
					<hr id="connected-line-buyer-created"/>
				</div>
			)}	
			<div id="profile-img-container-buyer-created">
				<Image
				alt=""
				width={100}  
				height={100}
				id="profile-photo-buyer-created" 
				src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/Unnamed-Icon.jpg"/>
			</div>	 
			<h1 id="name-buyer-created">Unnamed</h1>  
			<p id="description-buyer-created">Creator & Collector</p> 
			<div id="share-div-buyer-created">
				<p id="share-div-desc-buyer-created">SHARE</p>
				<button id="copy-link-buyer-created"
				onClick={copyLink}>
					<Image
					alt=""
					width={15}  
					height={8} 
					id="copy-link-icon-buyer-created" 
					src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/link.png"/>
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
				<Image
				alt=""
				width={25}  
				height={25}
				id="cart-icon-collected-buyer-created" 
				src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/Add.png"/>
			</p>

		</div>			
		     
        </>
    );
}

export default PrototypeBuyerCreated;