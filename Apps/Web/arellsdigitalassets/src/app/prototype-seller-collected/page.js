"use client";

// Change below link after test
import '../css/prototype/seller-collected.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';

import Head from 'next/head'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PrototypeSellerCollected = () => {

{/*<!-- useState constants below -->*/}
	const [showCopiedLink, setCopiedLink] = useState(false);
		
	const [cartLinkSellerCollected, setCartLinkSellerCollected] = useState(true);
	const [cartLinkConnectedSellerCollected, setCartLinkConnectedSellerCollected] = useState(false);
	const [cartLinkFullSellerCollected, setCartLinkFullSellerCollected] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivSellerCollected, setWalletConnectedDivSellerCollected] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype-seller-collected'}`);
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
		
		setCartLinkSellerCollected(false);
		setWalletConnectedDivSellerCollected(true);
		
		setCartLinkConnectedSellerCollected(true);
		
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
			setCartLinkSellerCollected(false);
			setWalletConnectedDivSellerCollected(true);
			
			setCartLinkConnectedSellerCollected(true);
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
			setCartLinkConnectedSellerCollected(false);
			setCartLinkFullSellerCollected(true);
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

			<meta name="title" content="Seller Collections Prototype" />
			<meta name="description" content="Prototype for Seller Collections" />
			<meta name="google" content="nositelinkssearchbox" />
			<meta name="keywords" content="Arells" />
			<meta name="author" content="Arells" />
			<meta name="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-seller-collections" />

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg" />
			<meta property="og:site_name" content="Arells" />
			<meta property="og:type" content="website" />
			<meta property="og:title" content="Seller Collections Prototype" />
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-seller-collected" />
			<meta property="og:description" content="Prototype for Seller Collections" />
			<meta property="og:image:type" content="image/jpg" />
			<meta property="og:image:width" content="700" />
			<meta property="og:image:height" content="400" />

			<meta name="twitter:title" content="Seller Collections Prototype" />
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg" />
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-seller-collected" />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:description" content="Prototype for Seller Collections" />
		</Head>

		<title>Prototype Seller Collections</title>	

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


		<div id="prototype-seller-collected-wrapper">
				<div id="header-seller-collected">
			
			{/*<!-- Change below link after test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-seller-collected">
						<img id="arells-icon-seller-collected" src="/icons&images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>							
				{cartLinkSellerCollected && (
					<button id="cart-link-seller-collected" onClick={connectWallet}>
						<img id="cart-icon-seller-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedSellerCollected && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-connected-seller-collected">
							<img id="cart-icon-seller-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}		
				{cartLinkFullSellerCollected && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-full-seller-collected">
							<img id="cart-icon-seller-collected" src="/icons&images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>	
				)}	
			</div>
			<img id="word-logo-seller-collected" src="/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-collected">NEVER LOSE MONEY SELLING ART</p>
			{walletConnectedDivSellerCollected && (
				<div id="wallet-connected-div-seller-collected">
					<hr id="connected-line-seller-collected"/>
					<p id="wallet-connected-seller-collected" >
					WALLET CONNECTED</p>
					<hr id="connected-line-seller-collected"/>
				</div>
			)}	
			<div id="profile-img-container-seller-collected">
				<img id="profile-photo-seller-collected" src="/icons&images/prototype/proto-banner.jpg"/>
			</div>	 
			<h1 id="name-seller-collected">Abstract Kadabra</h1>  
			<p id="description-seller-collected">Here rests life&apos;s abstractions captured in majestic endeavors.</p> 
			<div id="share-div-seller-collected">
				<p id="share-div-desc-seller-collected">SHARE</p>
				<button id="copy-link-seller-collected"
				onClick={copyLink}>
					<img id="copy-link-icon-seller-collected" src="/icons&images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-seller-collected"/>
			<div id="created-collected-seller-collected">
				{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/prototype-seller-created">
					<a id="created-seller-collected" >Created</a>		
				</Link>	
				<a id="collected-seller-collected">Collected</a>	
			</div>
			<p id="no-art-seller-collected">
				no art collected
				<img id="cart-icon-collected-seller-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
			</p>

		</div>			
		     
        </>
    );
}

export default PrototypeSellerCollected;