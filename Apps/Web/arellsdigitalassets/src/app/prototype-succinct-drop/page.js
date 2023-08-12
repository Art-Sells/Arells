"use client";

// Change below link after test
import '../css/prototype/images/layers.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';
import '../css/modals/coming-soon.css';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const layers = () => {

	const [elementId, setElementId] = useState('');

	useEffect(() => {
		// Set the id prop here; this code will only execute on the client-side
		setElementId('prototype-layers-word');
	}, []);



	

{/*<!-- useState constants below -->*/}
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkLayers, setCartLinkLayers] = useState(true);
	const [cartLinkConnectedLayers, setCartLinkConnectedLayers] = useState(false);
	const [cartLinkFullLayers, setCartLinkFullLayers] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivLayers, setWalletConnectedDivLayers] = useState(false);

	const [showComingSoon, setComingSoon] = useState(false);

	const [ownedByCreatorLayers, setOwnedByCreatorLayers] = useState(true);
	const [ownedByBuyerLayers, setOwnedByBuyerLayers] = useState(false);

	const [layersPricesBeforeLayers, setLayersPricesBeforeLayers] = useState(true);
	const [layersPricesAfterLayers, setLayersPricesAfterLayers] = useState(false);

	const [layersAddToCartLayers, setLayersAddToCartLayers] = useState(true);		
	const [layersAddToCartConnectedLayers, setLayersAddToCartConnectedLayers] = useState(false);
	const [layersAddedLayers, setLayersAddedLayers] = useState(false);
	const [layersCollectedLayers, setLayersCollectedLayers] = useState(false);


{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}
	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype-layers'}`);
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
		
		setCartLinkLayers(false);
		setWalletConnectedDivLayers(true);
		
		setCartLinkConnectedLayers(true);

		setLayersAddToCartLayers(false);		
		setLayersAddToCartConnectedLayers(true);
		
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
			setCartLinkLayers(false);
			setWalletConnectedDivLayers(true);
			
			setCartLinkConnectedLayers(true);

			setLayersAddToCartLayers(false);		
			setLayersAddToCartConnectedLayers(true);
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
	function addLayersToCart() {
		setLayersAddToCartLayers(false);
		setLayersAddedLayers(true);

		setCartLinkConnectedLayers(false);		
		setCartLinkFullLayers(true);

		sessionStorage.setItem('layersAdded', 'true');
		setLayersAdded('true');
	}	
	
{/*<!-- Add To Cart function/s above -->*/}


{/*<!-- Added/Purchased To function/s below -->*/}

	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedLayers(false);
			setCartLinkFullLayers(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);
	useEffect(() => {
		if (layersAdded === 'true') {
			setLayersAddToCartLayers(false);		
			setLayersAddToCartConnectedLayers(false);
			setLayersAddedLayers(true);
		}
	}, [layersAdded]);
		//Session Storage Getters below
	const [layersPurchased, setLayersPurchased] = useState(null);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('layersPurchased');
		setLayersPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (layersPurchased === 'true') {
			setLayersPricesBeforeLayers(false);
			setLayersPricesAfterLayers(true);

			setOwnedByCreatorLayers(false);
			setOwnedByBuyerLayers(true);

			setLayersAddToCartLayers(false);		
			setLayersAddToCartConnectedLayers(false);
			setLayersAddedLayers(false);
			setLayersCollectedLayers(true);
		}
	}, [layersPurchased]);

{/*<!-- Added/Purchased To function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Layers Prototype"/>
			<meta name="description" content="Prototype for Layers"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-layers"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>	
			<meta property="og:site_name" content="Arells"/>	
			<meta property="og:type" content="website"/>				
			<meta property="og:title" content="Layers Prototype"/>
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-layers"/>
			<meta property="og:description" content="Prototype for Layers"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Layers Prototype"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-layers"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Prototype for Layers"/>
		</Head>

		<title>Prototype Layers</title>	

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


		<div id="layers-wrapper">
			<div id="header-layers">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-layers">
							<img id="arells-icon-layers" src="/icons&images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkLayers && (
						<button id="cart-link-layers" onClick={connectWallet}>
							<img id="cart-icon-layers" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedLayers && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-connected-layers">
								<img id="cart-icon-layers" src="/icons&images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullLayers && (
						<Link legacyBehavior href="/prototype-cart">
							<a id="cart-link-full-layers">
								<img id="cart-icon-full-layers" src="/icons&images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<img id="word-logo-layers" src="/icons&images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-layers">ART SELLS</p>
				{walletConnectedDivLayers && (
					<div id="wallet-connected-div-layers">
						<hr id="connected-line-layers"/>
						<p id="wallet-connected-layers" >
						WALLET CONNECTED</p>
						<hr id="connected-line-layers"/>
					</div>
				)}

            <div id="layers">
                <img id="photo-layers" src="/icons&images/prototype/4.jpg"/>
                <h3 id="name-layers">Colour Glass</h3>
                <div id="share-div-layers">
                    <p id="share-div-desc-layers">SHARE</p> 
                    <button id="copy-link-layers"
                    onClick={copyLink}>
                        <img id="copy-link-icon-layers" src="/icons&images/prototype/link.png"/>
                        COPY LINK
                    </button>	
                </div>
                <div id="created-by-layers">
                    <p id="creator-owner-desc-layers">Created By</p>
                    <a id="creator-owner-link-layers" href="/prototype-seller-created">
                        Abstract Kadabra
                    </a>
                </div>
				{ownedByCreatorLayers && (
                    <div id="owned-by-creator-layers" >
                        <p id="creator-owner-desc-layers">Owned By</p> 
                        <a id="creator-owner-link-layers" href="/prototype-seller-created">
                            Abstract Kadabra</a>
                    </div>
				)}
				{ownedByBuyerLayers && (
                    <div id="owned-by-buyer-layers">
                        <p id="creator-owner-desc-layers">Owned By</p> 
                        <a id="creator-owner-link-layers" href="/prototype-buyer-collected">
                            0x71C7656E...
                        </a>
                    </div>
				)}
				<hr id="line-layers"/>
				{layersPricesBeforeLayers && (
					<div id="layers-prices-before-layers">
						<p id="PAP-layers">Price After Purchase</p>
						<p id="PAP-layers-before-layers">$20,000,000</p>
						<hr id="priceline-layers"/>
						<p id="yourprice-layers">Price</p>
						<p id="price-layers-before-layers">$400,000</p>
					</div>
				)}
				{layersPricesAfterLayers && (
					<div id="layers-prices-after-layers">
						<p id="PAP-layers">Price After Purchase</p>
						<p id="PAP-layers-after-layers">$1,000,000,000</p>
						<hr id="priceline-layers"/>
						<p id="yourprice-layers">Price</p>
						<p id="price-layers-after-layers">$20,000,000</p>
					</div>
				)}

				{layersAddToCartLayers && (
					<button id="layers-add-to-cart-layers" onClick={connectWallet}>
					ADD TO CART</button>
				)}
				{layersAddToCartConnectedLayers && (
					<button id="layers-add-to-cart-connected-layers" onClick={addLayersToCart}>
					ADD TO CART</button>
				)}
				{layersAddedLayers && (
					<button id="layers-added-layers">
					ADDED</button>	
				)}
				{layersCollectedLayers && (
					<button id="layers-collected-layers">
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

export default layers;