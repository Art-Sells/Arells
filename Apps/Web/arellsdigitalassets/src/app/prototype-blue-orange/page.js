"use client";

// Change below link after test
import '../css/prototype/images/blue-orange.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';
import '../css/modals/coming-soon.css';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const blueOrange = () => {

	const [elementId, setElementId] = useState('');

	useEffect(() => {
		// Set the id prop here; this code will only execute on the client-side
		setElementId('prototype-blue-orange-word');
	}, []);



	

{/*<!-- useState constants below -->*/}
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkBlueOrange, setCartLinkBlueOrange] = useState(true);
	const [cartLinkConnectedBlueOrange, setCartLinkConnectedBlueOrange] = useState(false);
	const [cartLinkFullBlueOrange, setCartLinkFullBlueOrange] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivBlueOrange, setWalletConnectedDivBlueOrange] = useState(false);

	const [showComingSoon, setComingSoon] = useState(false);

	const [ownedByCreatorBlueOrange, setOwnedByCreatorBlueOrange] = useState(true);
	const [ownedByBuyerBlueOrange, setOwnedByBuyerBlueOrange] = useState(false);

	const [blueOrangePricesBeforeBlueOrange, setBlueOrangePricesBeforeBlueOrange] = useState(true);
	const [blueOrangePricesAfterBlueOrange, setBlueOrangePricesAfterBlueOrange] = useState(false);

	const [blueOrangeAddToCartBlueOrange, setBlueOrangeAddToCartBlueOrange] = useState(true);		
	const [blueOrangeAddToCartConnectedBlueOrange, setBlueOrangeAddToCartConnectedBlueOrange] = useState(false);
	const [blueOrangeAddedBlueOrange, setBlueOrangeAddedBlueOrange] = useState(false);
	const [blueOrangeCollectedBlueOrange, setBlueOrangeCollectedBlueOrange] = useState(false);

{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}
	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype-blue-orange'}`);
	}, [router.asPath]);
	const copyLink = () => {
		navigator.clipboard.writeText(fullUrl).then(() => {
			setCopiedLink(true);
		  });
	};
  
	function closeCopiedLink() {
	  setCopiedLink(false);
	};
{/*<!-- Copy Links function/s above -->*/}


{/*<!-- Connect Wallet function/s below -->*/}
	function connectWallet () {
		setShowConnectWallet(true);
	};

	function walletConnected () {
		setShowConnectWallet(false);
		
		setCartLinkBlueOrange(false);
		setWalletConnectedDivBlueOrange(true);
		
		setCartLinkConnectedBlueOrange(true);

		setBlueOrangeAddToCartBlueOrange(false);		
		setBlueOrangeAddToCartConnectedBlueOrange(true);
		
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
			setCartLinkBlueOrange(false);
			setWalletConnectedDivBlueOrange(true);
			
			setCartLinkConnectedBlueOrange(true);

			setBlueOrangeAddToCartBlueOrange(false);		
			setBlueOrangeAddToCartConnectedBlueOrange(true);
		}
	}, [walletConnectedSession]);
{/*<!-- Connect Wallet function/s above -->*/}

{/*<!-- Coming Soon function/s below -->*/}
	function comingSoon() {
		setComingSoon(true);
	};

	function closeComingSoon() {
		setComingSoon(false);
	};
{/*<!-- Coming Soon function/s above -->*/}


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
	function addBlueOrangeToCart() {
		setBlueOrangeAddToCartBlueOrange(false);
		setBlueOrangeAddedBlueOrange(true);

		setCartLinkConnectedBlueOrange(false);		
		setCartLinkFullBlueOrange(true);

		sessionStorage.setItem('blueOrangeAdded', 'true');
		setBlueOrangeAdded('true');
	}	
	
{/*<!-- Add To Cart function/s above -->*/}


{/*<!-- Added/Purchased To function/s below -->*/}

	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedBlueOrange(false);
			setCartLinkFullBlueOrange(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);
	useEffect(() => {
		if (blueOrangeAdded === 'true') {
			setBlueOrangeAddToCartBlueOrange(false);		
			setBlueOrangeAddToCartConnectedBlueOrange(false);
			setBlueOrangeAddedBlueOrange(true);
		}
	}, [blueOrangeAdded]);
		//Session Storage Getters below
	const [blueOrangePurchased, setBlueOrangePurchased] = useState(null);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('blueOrangePurchased');
		setBlueOrangePurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (blueOrangePurchased === 'true') {
			setBlueOrangePricesBeforeBlueOrange(false);
			setBlueOrangePricesAfterBlueOrange(true);

			setOwnedByCreatorBlueOrange(false);
			setOwnedByBuyerBlueOrange(true);

			setBlueOrangeAddToCartBlueOrange(false);		
			setBlueOrangeAddToCartConnectedBlueOrange(false);
			setBlueOrangeAddedBlueOrange(false);
			setBlueOrangeCollectedBlueOrange(true);
		}
	}, [blueOrangePurchased]);

{/*<!-- Added/Purchased To function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Blue Orange Prototype"/>
			<meta name="description" content="Prototype for Blue Orange"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-blue-orange"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>	
			<meta property="og:site_name" content="Arells"/>	
			<meta property="og:type" content="website"/>				
			<meta property="og:title" content="Blue Orange Prototype"/>
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-blue-orange"/>
			<meta property="og:description" content="Prototype for Blue Orange"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Blue Orange Prototype"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-blue-orange"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Prototype for Blue Orange"/>
		</Head>

		<title>Prototype Blue Orange</title>	

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

		{showComingSoon && (
			<div id="comingSoon">
				<div class="modal-content">
				<p>COMING SOON</p>
				<button className="close"
					onClick={closeComingSoon}>OK</button>	
				</div>
			</div>	
		)}
{/*<!-- Modals Above -->*/}


		<div id="blue-orange-wrapper">
			<div id="header-blue-orange">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-blue-orange">
							<img id="arells-icon-blue-orange" src="/icons&images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkBlueOrange && (
						<button id="cart-link-blue-orange" onClick={connectWallet}>
							<img id="cart-icon-blue-orange" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedBlueOrange && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-connected-blue-orange">
								<img id="cart-icon-blue-orange" src="/icons&images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullBlueOrange && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-full-blue-orange">
								<img id="cart-icon-full-blue-orange" src="/icons&images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<img id="word-logo-blue-orange" src="/icons&images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-blue-orange">ART SELLS</p>
				{walletConnectedDivBlueOrange && (
					<div id="wallet-connected-div-blue-orange">
						<hr id="connected-line-blue-orange"/>
						<p id="wallet-connected-blue-orange" >
						WALLET CONNECTED</p>
						<hr id="connected-line-blue-orange"/>
					</div>
				)}

			<div id="blue-orange">
				<img id="photo-blue-orange" src="/icons&images/prototype/1.jpg"/>
				<h3 id="name-blue-orange">Blue Orange</h3> 
				<div id="share-div-blue-orange">
					<p id="share-div-desc-blue-orange">SHARE</p>
					<button id="copy-link-blue-orange"
					onClick={copyLink}>
						<img id="copy-link-icon-blue-orange" src="/icons&images/prototype/link.png"/>
						COPY LINK
					</button>	
				</div>
				<div id="created-by-blue-orange">
					<p id="creator-owner-desc-blue-orange">Created By</p>
					<a id="creator-owner-link-blue-orange" href="/prototype-seller-created">
						Abstract Kadabra
					</a>
				</div>
				{ownedByCreatorBlueOrange && (
					<div id="owned-by-creator-blue-orange">
						<p id="creator-owner-desc-blue-orange">Owned By</p> 
						<a id="creator-owner-link-blue-orange" href="/prototype-seller-created">
							Abstract Kadabra</a>
					</div>
				)}
				{ownedByBuyerBlueOrange && (
					<div id="owned-by-buyer-blue-orange">
						<p id="creator-owner-desc-blue-orange">Owned By</p> 
						<a id="creator-owner-link-blue-orange" href="/prototype-buyer-collected">
							0x71C7656E...
						</a>
					</div>
				)}
				<hr id="line-blue-orange"/>
				{blueOrangePricesBeforeBlueOrange && (
					<div id="blue-orange-prices-before-blue-orange">
						<p id="PAP-blue-orange">Price After Purchase</p>
						<p id="PAP-blue-orange-before-blue-orange">$60,000</p>
						<hr id="priceline-blue-orange"/>
						<p id="yourprice-blue-orange">Price</p>
						<p id="price-blue-orange-before-blue-orange">$1,200</p>
					</div>	
				)}
				{blueOrangePricesAfterBlueOrange && (
					<div id="blue-orange-prices-after-blue-orange">
						<p id="PAP-blue-orange">Price After Purchase</p>
						<p id="PAP-blue-orange-after-blue-orange">$3,000,000</p>
						<hr id="priceline-blue-orange"/>
						<p id="yourprice-blue-orange">Price</p>
						<p id="price-blue-orange-after-blue-orange">$60,000</p>
					</div>	
				)}

				{blueOrangeAddToCartBlueOrange && (
					<button id="blue-orange-add-to-cart-blue-orange" onClick={connectWallet}>
					ADD TO CART</button>
				)}
				{blueOrangeAddToCartConnectedBlueOrange && (
					<button id="blue-orange-add-to-cart-connected-blue-orange" onClick={addBlueOrangeToCart}>
					ADD TO CART</button>
				)}
				{blueOrangeAddedBlueOrange && (
					<button id="blue-orange-added-blue-orange">
					ADDED</button>	
				)}
				{blueOrangeCollectedBlueOrange && (
					<button id="blue-orange-collected-blue-orange">
					COLLECTED</button>
				)}



					
				<div id="fingerprints">
					<p id="digital-fingerprints">DIGITAL FINGERPRINTS</p>
					<span>
						<button id="fingerprints-button"
							onClick={comingSoon}>
							<img id="fingerprints-icon" src="/icons&images/prototype/etherscan-logo.png"/>
						</button>	
					</span>
					<span>
						<button id="fingerprints-button"
							onClick={comingSoon}>
							<img id="fingerprints-icon" src="/icons&images/prototype/ipfs.png"/>
						</button>	
					</span>
					<span>
						<button id="fingerprints-button"
							onClick={comingSoon}>
							<img id="fingerprints-icon" src="/icons&images/prototype/ipfslite.png"/>
						</button>	
					</span>
				</div>	    		
											
			</div>

				<p id={elementId}>PROTOTYPE</p>
		</div>			
		     
        </>
    );
}

export default blueOrange;