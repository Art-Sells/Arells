"use client";

// Change below link after test
import '../css/prototype/images/beach-houses.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';
import '../css/modals/coming-soon.css';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const beachHouses = () => {

	const [elementId, setElementId] = useState('');

	useEffect(() => {
		// Set the id prop here; this code will only execute on the client-side
		setElementId('prototype-beach-houses-word');
	}, []);



	

{/*<!-- useState constants below -->*/}
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkBeachHouses, setCartLinkBeachHouses] = useState(true);
	const [cartLinkConnectedBeachHouses, setCartLinkConnectedBeachHouses] = useState(false);
	const [cartLinkFullBeachHouses, setCartLinkFullBeachHouses] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivBeachHouses, setWalletConnectedDivBeachHouses] = useState(false);

	const [showComingSoon, setComingSoon] = useState(false);

	const [ownedByCreatorBeachHouses, setOwnedByCreatorBeachHouses] = useState(true);
	const [ownedByBuyerBeachHouses, setOwnedByBuyerBeachHouses] = useState(false);

	const [beachHousesPricesBeforeBeachHouses, setBeachHousesPricesBeforeBeachHouses] = useState(true);
	const [beachHousesPricesAfterBeachHouses, setBeachHousesPricesAfterBeachHouses] = useState(false);

	const [beachHousesAddToCartBeachHouses, setBeachHousesAddToCartBeachHouses] = useState(true);		
	const [beachHousesAddToCartConnectedBeachHouses, setBeachHousesAddToCartConnectedBeachHouses] = useState(false);
	const [beachHousesAddedBeachHouses, setBeachHousesAddedBeachHouses] = useState(false);
	const [beachHousesCollectedBeachHouses, setBeachHousesCollectedBeachHouses] = useState(false);


{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}
	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype-beach-houses'}`);
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
		
		setCartLinkBeachHouses(false);
		setWalletConnectedDivBeachHouses(true);
		
		setCartLinkConnectedBeachHouses(true);

		setBeachHousesAddToCartBeachHouses(false);		
		setBeachHousesAddToCartConnectedBeachHouses(true);
		
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
			setCartLinkBeachHouses(false);
			setWalletConnectedDivBeachHouses(true);
			
			setCartLinkConnectedBeachHouses(true);

			setBeachHousesAddToCartBeachHouses(false);		
			setBeachHousesAddToCartConnectedBeachHouses(true);
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
	function addBeachHousesToCart() {
		setBeachHousesAddToCartBeachHouses(false);
		setBeachHousesAddedBeachHouses(true);

		setCartLinkConnectedBeachHouses(false);		
		setCartLinkFullBeachHouses(true);

		sessionStorage.setItem('beachHousesAdded', 'true');
		setBeachHousesAdded('true');
	}	
	
{/*<!-- Add To Cart function/s above -->*/}


{/*<!-- Added/Purchased To function/s below -->*/}

	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedBeachHouses(false);
			setCartLinkFullBeachHouses(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);
	useEffect(() => {
		if (beachHousesAdded === 'true') {
			setBeachHousesAddToCartBeachHouses(false);		
			setBeachHousesAddToCartConnectedBeachHouses(false);
			setBeachHousesAddedBeachHouses(true);
		}
	}, [beachHousesAdded]);
		//Session Storage Getters below
	const [beachHousesPurchased, setBeachHousesPurchased] = useState(null);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('beachHousesPurchased');
		setBeachHousesPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (beachHousesPurchased === 'true') {
			setBeachHousesPricesBeforeBeachHouses(false);
			setBeachHousesPricesAfterBeachHouses(true);

			setOwnedByCreatorBeachHouses(false);
			setOwnedByBuyerBeachHouses(true);

			setBeachHousesAddToCartBeachHouses(false);		
			setBeachHousesAddToCartConnectedBeachHouses(false);
			setBeachHousesAddedBeachHouses(false);
			setBeachHousesCollectedBeachHouses(true);
		}
	}, [beachHousesPurchased]);

{/*<!-- Added/Purchased To function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Beach Houses Prototype"/>
			<meta name="description" content="Prototype for Beach Houses"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-beach-houses"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>	
			<meta property="og:site_name" content="Arells"/>	
			<meta property="og:type" content="website"/>				
			<meta property="og:title" content="Beach Houses Prototype"/>
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-beach-houses"/>
			<meta property="og:description" content="Prototype for Beach Houses"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Beach Houses Prototype"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-beach-houses"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Prototype for Beach Houses"/>
		</Head>

		<title>Prototype Beach Houses</title>	

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


		<div id="beach-houses-wrapper">
			<div id="header-beach-houses">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-beach-houses">
							<img id="arells-icon-beach-houses" src="/icons&images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkBeachHouses && (
						<button id="cart-link-beach-houses" onClick={connectWallet}>
							<img id="cart-icon-beach-houses" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedBeachHouses && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-connected-beach-houses">
								<img id="cart-icon-beach-houses" src="/icons&images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullBeachHouses && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-full-beach-houses">
								<img id="cart-icon-full-beach-houses" src="/icons&images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<img id="word-logo-beach-houses" src="/icons&images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-beach-houses">ART SELLS</p>
				{walletConnectedDivBeachHouses && (
					<div id="wallet-connected-div-beach-houses">
						<hr id="connected-line-beach-houses"/>
						<p id="wallet-connected-beach-houses" >
						WALLET CONNECTED</p>
						<hr id="connected-line-beach-houses"/>
					</div>
				)}

			<div id="beach-houses">
				<img id="photo-beach-houses" src="/icons&images/prototype/2.jpg"/>
				<h3 id="name-beach-houses">Beach Houses</h3> 
				<div id="share-div">
					<p id="share-div-desc">SHARE</p>
					<button id="copy-link-beach-houses"
					onClick={copyLink}>
						<img id="copy-link-icon-beach-houses" src="/icons&images/prototype/link.png"/>
						COPY LINK
					</button>	
				</div>
				<div id="created-by-beach-houses">
					<p id="creator-owner-desc-beach-houses">Created By</p>
					<a id="creator-owner-link-beach-houses" href="/prototype-seller-created">
						Abstract Kadabra
					</a>
				</div>
				{ownedByCreatorBeachHouses && (
					<div id="owned-by-creator-beach-houses">
						<p id="creator-owner-desc-beach-houses">Owned By</p> 
						<a id="creator-owner-link-beach-houses" href="/prototype-seller-created">
							Abstract Kadabra</a>
					</div>
				)}
				{ownedByBuyerBeachHouses && (
					<div id="owned-by-buyer-beach-houses">
						<p id="creator-owner-desc-beach-houses">Owned By</p> 
						<a id="creator-owner-link-beach-houses" href="/prototype-buyer-collected">
							0x71C7656E...
						</a>
					</div>
				)}
				<hr id="line-beach-houses"/>
				{beachHousesPricesBeforeBeachHouses && (
					<div id="beach-houses-prices-before-beach-houses">
						<p id="PAP-beach-houses">Price After Purchase</p>
						<p id="PAP-beach-houses-before-beach-houses">$10,000</p>
						<hr id="priceline-beach-houses"/>
						<p id="yourprice-beach-houses">Price</p>
						<p id="price-beach-houses-before-beach-houses">$200</p>
					</div>
				)}
				{beachHousesPricesAfterBeachHouses && (
					<div id="beach-houses-prices-after-beach-houses">
						<p id="PAP-beach-houses">Price After Purchase</p>
						<p id="PAP-beach-houses-after-beach-houses">$500,000</p>
						<hr id="priceline-beach-houses"/>
						<p id="yourprice-beach-houses">Price</p>
						<p id="price-beach-houses-after-beach-houses">$10,000</p>
					</div>
				)}

				{beachHousesAddToCartBeachHouses && (
					<button id="beach-houses-add-to-cart-beach-houses" onClick={connectWallet}>
					ADD TO CART</button>
				)}
				{beachHousesAddToCartConnectedBeachHouses && (
					<button id="beach-houses-add-to-cart-connected-beach-houses" onClick={addBeachHousesToCart}>
					ADD TO CART</button>
				)}
				{beachHousesAddedBeachHouses && (
					<button id="beach-houses-added-beach-houses">
					ADDED</button>	
				)}
				{beachHousesCollectedBeachHouses && (
					<button id="beach-houses-collected-beach-houses">
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

export default beachHouses;