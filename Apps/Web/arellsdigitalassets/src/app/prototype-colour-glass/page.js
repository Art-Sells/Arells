"use client";

// Change below link after test
import '../css/prototype/images/colour-glass.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';
import '../css/modals/coming-soon.css';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const colourGlass = () => {

	const [elementId, setElementId] = useState('');

	useEffect(() => {
		// Set the id prop here; this code will only execute on the client-side
		setElementId('prototype-colour-glass-word');
	}, []);



	

{/*<!-- useState constants below -->*/}
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkColourGlass, setCartLinkColourGlass] = useState(true);
	const [cartLinkConnectedColourGlass, setCartLinkConnectedColourGlass] = useState(false);
	const [cartLinkFullColourGlass, setCartLinkFullColourGlass] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivColourGlass, setWalletConnectedDivColourGlass] = useState(false);

	const [showComingSoon, setComingSoon] = useState(false);

	const [ownedByCreatorColourGlass, setOwnedByCreatorColourGlass] = useState(true);
	const [ownedByBuyerColourGlass, setOwnedByBuyerColourGlass] = useState(false);

	const [colourGlassPricesBeforeColourGlass, setColourGlassPricesBeforeColourGlass] = useState(true);
	const [colourGlassPricesAfterColourGlass, setColourGlassPricesAfterColourGlass] = useState(false);

	const [colourGlassAddToCartColourGlass, setColourGlassAddToCartColourGlass] = useState(true);		
	const [colourGlassAddToCartConnectedColourGlass, setColourGlassAddToCartConnectedColourGlass] = useState(false);
	const [colourGlassAddedColourGlass, setColourGlassAddedColourGlass] = useState(false);
	const [colourGlassCollectedColourGlass, setColourGlassCollectedColourGlass] = useState(false);


{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}
	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype-colour-glass'}`);
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
		
		setCartLinkColourGlass(false);
		setWalletConnectedDivColourGlass(true);
		
		setCartLinkConnectedColourGlass(true);

		setColourGlassAddToCartColourGlass(false);		
		setColourGlassAddToCartConnectedColourGlass(true);
		
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
			setCartLinkColourGlass(false);
			setWalletConnectedDivColourGlass(true);
			
			setCartLinkConnectedColourGlass(true);

			setColourGlassAddToCartColourGlass(false);		
			setColourGlassAddToCartConnectedColourGlass(true);
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
	function addColourGlassToCart() {
		setColourGlassAddToCartColourGlass(false);
		setColourGlassAddedColourGlass(true);

		setCartLinkConnectedColourGlass(false);		
		setCartLinkFullColourGlass(true);

		sessionStorage.setItem('colourGlassAdded', 'true');
		setColourGlassAdded('true');
	}	
	
{/*<!-- Add To Cart function/s above -->*/}


{/*<!-- Added/Purchased To function/s below -->*/}

	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedColourGlass(false);
			setCartLinkFullColourGlass(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);
	useEffect(() => {
		if (colourGlassAdded === 'true') {
			setColourGlassAddToCartColourGlass(false);		
			setColourGlassAddToCartConnectedColourGlass(false);
			setColourGlassAddedColourGlass(true);
		}
	}, [colourGlassAdded]);
		//Session Storage Getters below
	const [colourGlassPurchased, setColourGlassPurchased] = useState(null);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('colourGlassPurchased');
		setColourGlassPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (colourGlassPurchased === 'true') {
			setColourGlassPricesBeforeColourGlass(false);
			setColourGlassPricesAfterColourGlass(true);

			setOwnedByCreatorColourGlass(false);
			setOwnedByBuyerColourGlass(true);

			setColourGlassAddToCartColourGlass(false);		
			setColourGlassAddToCartConnectedColourGlass(false);
			setColourGlassAddedColourGlass(false);
			setColourGlassCollectedColourGlass(true);
		}
	}, [colourGlassPurchased]);

{/*<!-- Added/Purchased To function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Colour Glass Prototype"/>
			<meta name="description" content="Prototype for Colour Glass"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-colour-glass"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>	
			<meta property="og:site_name" content="Arells"/>	
			<meta property="og:type" content="website"/>				
			<meta property="og:title" content="Colour Glass Prototype"/>
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-colour-glass"/>
			<meta property="og:description" content="Prototype for Colour Glass"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Colour Glass Prototype"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-colour-glass"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Prototype for Colour Glass"/>
		</Head>

		<title>Prototype Colour Glass</title>	

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


		<div id="colour-glass-wrapper">
			<div id="header-colour-glass">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-colour-glass">
							<img id="arells-icon-colour-glass" src="/icons&images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkColourGlass && (
						<button id="cart-link-colour-glass" onClick={connectWallet}>
							<img id="cart-icon-colour-glass" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedColourGlass && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-connected-colour-glass">
								<img id="cart-icon-colour-glass" src="/icons&images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullColourGlass && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-full-colour-glass">
								<img id="cart-icon-full-colour-glass" src="/icons&images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<img id="word-logo-colour-glass" src="/icons&images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-colour-glass">ART SELLS</p>
				{walletConnectedDivColourGlass && (
					<div id="wallet-connected-div-colour-glass">
						<hr id="connected-line-colour-glass"/>
						<p id="wallet-connected-colour-glass" >
						WALLET CONNECTED</p>
						<hr id="connected-line-colour-glass"/>
					</div>
				)}

            <div id="colour-glass">
                <img id="photo-colour-glass" src="/icons&images/prototype/3.jpg"/>
                <h3 id="name-colour-glass">Colour Glass</h3>
                <div id="share-div-colour-glass">
                    <p id="share-div-desc-colour-glass">SHARE</p> 
                    <button id="copy-link-colour-glass"
                    onClick={copyLink}>
                        <img id="copy-link-icon-colour-glass" src="/icons&images/prototype/link.png"/>
                        COPY LINK
                    </button>	
                </div>
                <div id="created-by-colour-glass">
                    <p id="creator-owner-desc-colour-glass">Created By</p>
                    <a id="creator-owner-link-colour-glass" href="/prototype-seller-created">
                        Abstract Kadabra
                    </a>
                </div>
				{ownedByCreatorColourGlass && (
                    <div id="owned-by-creator-colour-glass" >
                        <p id="creator-owner-desc-colour-glass">Owned By</p> 
                        <a id="creator-owner-link-colour-glass" href="/prototype-seller-created">
                            Abstract Kadabra</a>
                    </div>
				)}
				{ownedByBuyerColourGlass && (
                    <div id="owned-by-buyer-colour-glass">
                        <p id="creator-owner-desc-colour-glass">Owned By</p> 
                        <a id="creator-owner-link-colour-glass" href="/prototype-buyer-collected">
                            0x71C7656E...
                        </a>
                    </div>
				)}
				<hr id="line-colour-glass"/>
				{colourGlassPricesBeforeColourGlass && (
                    <div id="colour-glass-prices-before-colour-glass">
                        <p id="PAP-colour-glass">Price After Purchase</p>
                        <p id="PAP-colour-glass-before-colour-glass">$725,000</p>
                        <hr id="priceline-colour-glass"/>
                        <p id="yourprice-colour-glass">Price</p>
                        <p id="price-colour-glass-before-colour-glass">$14,500</p>
                    </div>
				)}
				{colourGlassPricesAfterColourGlass && (
                    <div id="colour-glass-prices-after-colour-glass">
                        <p id="PAP-colour-glass">Price After Purchase</p>
                        <p id="PAP-colour-glass-after-colour-glass">$36,250,000</p>
                        <hr id="priceline-colour-glass"/>
                        <p id="yourprice-colour-glass">Price</p>
                        <p id="price-colour-glass-after-colour-glass">$725,000</p>
                    </div>
				)}

				{colourGlassAddToCartColourGlass && (
					<button id="colour-glass-add-to-cart-colour-glass" onClick={connectWallet}>
					ADD TO CART</button>
				)}
				{colourGlassAddToCartConnectedColourGlass && (
					<button id="colour-glass-add-to-cart-connected-colour-glass" onClick={addColourGlassToCart}>
					ADD TO CART</button>
				)}
				{colourGlassAddedColourGlass && (
					<button id="colour-glass-added-colour-glass">
					ADDED</button>	
				)}
				{colourGlassCollectedColourGlass && (
					<button id="colour-glass-collected-colour-glass">
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

export default colourGlass;