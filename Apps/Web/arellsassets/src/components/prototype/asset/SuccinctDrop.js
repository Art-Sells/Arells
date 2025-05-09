"use client";
import React from 'react';


// Change below link after test
import '../../../app/css/prototype/asset/succinct-drop.css';
import '../../../app/css/modals/copiedlink.css';
import '../../../app/css/modals/connect-wallet.css';
import '../../../app/css/modals/coming-soon.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const SuccinctDrop = () => {

	const imageLoader = ({ src, width, quality }) => {
		return `/${src}?w=${width}&q=${quality || 100}`
	  }

	//Loader Functions
	const [showLoading, setLoading] = useState(true);
	const [imagesLoaded, setImagesLoaded] = useState({
	photoSuccinctDrop: false,
	});
	const handleImageLoaded = (imageName) => {
	setImagesLoaded(prevState => ({ 
		...prevState, 
		[imageName]: true 
	}));
	};
	useEffect(() => {
	if (Object.values(imagesLoaded).every(Boolean)) {
		setLoading(false);
	}
	}, [imagesLoaded]);


{/*<!-- useState constants below -->*/}
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkSuccinctDrop, setCartLinkSuccinctDrop] = useState(true);
	const [cartLinkConnectedSuccinctDrop, setCartLinkConnectedSuccinctDrop] = useState(false);
	const [cartLinkFullSuccinctDrop, setCartLinkFullSuccinctDrop] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivSuccinctDrop, setWalletConnectedDivSuccinctDrop] = useState(false);

	const [showComingSoon, setComingSoon] = useState(false);

	const [ownedByCreatorSuccinctDrop, setOwnedByCreatorSuccinctDrop] = useState(true);
	const [ownedByBuyerSuccinctDrop, setOwnedByBuyerSuccinctDrop] = useState(false);

	const [succinctDropPricesBeforeSuccinctDrop, setSuccinctDropPricesBeforeSuccinctDrop] = useState(true);
	const [succinctDropPricesAfterSuccinctDrop, setSuccinctDropPricesAfterSuccinctDrop] = useState(false);

	const [succinctDropAddToCartSuccinctDrop, setSuccinctDropAddToCartSuccinctDrop] = useState(true);		
	const [succinctDropAddToCartConnectedSuccinctDrop, setSuccinctDropAddToCartConnectedSuccinctDrop] = useState(false);
	const [succinctDropAddedSuccinctDrop, setSuccinctDropAddedSuccinctDrop] = useState(false);
	const [succinctDropCollectedSuccinctDrop, setSuccinctDropCollectedSuccinctDrop] = useState(false);


{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}
	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype/asset/succinct-drop'}`);
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
		
		setCartLinkSuccinctDrop(false);
		setWalletConnectedDivSuccinctDrop(true);
		
		setCartLinkConnectedSuccinctDrop(true);

		setSuccinctDropAddToCartSuccinctDrop(false);		
		setSuccinctDropAddToCartConnectedSuccinctDrop(true);
		
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
			setCartLinkSuccinctDrop(false);
			setWalletConnectedDivSuccinctDrop(true);
			
			setCartLinkConnectedSuccinctDrop(true);

			setSuccinctDropAddToCartSuccinctDrop(false);		
			setSuccinctDropAddToCartConnectedSuccinctDrop(true);
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
	function addSuccinctDropToCart() {
		setSuccinctDropAddToCartSuccinctDrop(false);
		setSuccinctDropAddedSuccinctDrop(true);

		setCartLinkConnectedSuccinctDrop(false);		
		setCartLinkFullSuccinctDrop(true);

		sessionStorage.setItem('succinctDropAdded', 'true');
		setSuccinctDropAdded('true');
	}	
	
{/*<!-- Add To Cart function/s above -->*/}


{/*<!-- Added/Purchased To function/s below -->*/}

	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedSuccinctDrop(false);
			setCartLinkFullSuccinctDrop(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);
	useEffect(() => {
		if (succinctDropAdded === 'true') {
			setSuccinctDropAddToCartSuccinctDrop(false);		
			setSuccinctDropAddToCartConnectedSuccinctDrop(false);
			setSuccinctDropAddedSuccinctDrop(true);
		}
	}, [succinctDropAdded]);
		//Session Storage Getters below
	const [succinctDropPurchased, setSuccinctDropPurchased] = useState(null);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('succinctDropPurchased');
		setSuccinctDropPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (succinctDropPurchased === 'true') {
			setSuccinctDropPricesBeforeSuccinctDrop(false);
			setSuccinctDropPricesAfterSuccinctDrop(true);

			setOwnedByCreatorSuccinctDrop(false);
			setOwnedByBuyerSuccinctDrop(true);

			setSuccinctDropAddToCartSuccinctDrop(false);		
			setSuccinctDropAddToCartConnectedSuccinctDrop(false);
			setSuccinctDropAddedSuccinctDrop(false);
			setSuccinctDropCollectedSuccinctDrop(true);
		}
	}, [succinctDropPurchased]);

{/*<!-- Added/Purchased To function/s above -->*/}
	
    return (
        <>

{/*<!-- Modals below -->*/}
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

		{showComingSoon && (
			<div id="comingSoon">
				<div class="modal-content">
				<p>COMING SOON</p>
				<button className="close"
					onClick={closeComingSoon}>OK</button>	
				</div>
			</div>	
		)}


		{showLoading && (
			<div id="spinnerBackground">
			<Image 
			loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}
{/*<!-- Modals Above -->*/}

			<div id="header-succinct-drop">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-succinct-drop">
							<Image
							loader={imageLoader}
							alt=""
							height={16}
							width={15}
							id="arells-icon-succinct-drop"
							src="images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkSuccinctDrop && (
						<button id="cart-link-succinct-drop" onClick={connectWallet}>
							<Image
							loader={imageLoader}
							alt=""
							height={15}
							width={16}
							id="cart-icon-succinct-drop"
							src="images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedSuccinctDrop && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-connected-succinct-drop">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16}
								id="cart-icon-succinct-drop"
								src="images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullSuccinctDrop && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-full-succinct-drop">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16} 
								id="cart-icon-full-succinct-drop" 
								src="images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<Image
				loader={imageLoader}
				alt=""
				width={110}  
				height={35}
				id="word-logo-succinct-drop" 
				src="images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-succinct-drop">NEVER LOSE MONEY SELLING ART</p>
				{walletConnectedDivSuccinctDrop && (
					<div id="wallet-connected-div-succinct-drop">
						<hr id="connected-line-succinct-drop"/>
						<p id="wallet-connected-succinct-drop" >
						WALLET CONNECTED</p>
						<hr id="connected-line-succinct-drop"/>
					</div>
				)}

            <div id="succinct-drop">
                <Image
				loader={imageLoader}
				onLoad={() => handleImageLoaded('photoSuccinctDrop')}
				alt=""
				width={400}  
				height={400}
				id="photo-succinct-drop"
				src="images/prototype/5.jpg"/>
                <h3 id="name-succinct-drop">Succinct Drop</h3>
                <div id="share-div-succinct-drop">
                    <p id="share-div-desc-succinct-drop">SHARE</p> 
                    <button id="copy-link-succinct-drop"
                    onClick={copyLink}>
                        <Image
						loader={imageLoader}
						alt=""
						width={15}  
						height={8}
						id="copy-link-icon-succinct-drop" 
						src="images/prototype/link.png"/>
                        COPY LINK
                    </button>	
                </div>
                <div id="created-by-succinct-drop">
                    <p id="creator-owner-desc-succinct-drop">Created By</p>
                    <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-succinct-drop">
                            Abstract Kadabra
                        </a>
					</Link>
                </div>
				{ownedByCreatorSuccinctDrop && (
                    <div id="owned-by-creator-succinct-drop" >
                        <p id="creator-owner-desc-succinct-drop">Owned By</p> 
                        <Link legacyBehavior href="/prototype/seller-created">
                            <a id="creator-owner-link-succinct-drop">
                                Abstract Kadabra
                            </a>
					    </Link>
                    </div>
				)}
				{ownedByBuyerSuccinctDrop && (
                    <div id="owned-by-buyer-succinct-drop">
                        <p id="creator-owner-desc-succinct-drop">Owned By</p> 
                        <Link legacyBehavior href="/prototype/buyer-collected">
                            <a id="creator-owner-link-succinct-drop" >
                                0x71C7656E...
                            </a>
					    </Link>
                    </div>
				)}
				<hr id="line-succinct-drop"/>
				{succinctDropPricesBeforeSuccinctDrop && (
					<div id="succinct-drop-prices-before-succinct-drop">
						<p id="PAP-succinct-drop">Price After Purchase</p>
						<p id="PAP-succinct-drop-after-succinct-drop">$200</p>
						<hr id="priceline-succinct-drop"/>
						<p id="yourprice-succinct-drop">Price</p>
						<p id="price-succinct-drop-after-succinct-drop">$100</p>
					</div>
				)}
				{succinctDropPricesAfterSuccinctDrop && (
					<div id="succinct-drop-prices-after-succinct-drop">
						<p id="PAP-succinct-drop">Price After Purchase</p>
						<p id="PAP-succinct-drop-before-succinct-drop">$1,000</p>
						<hr id="priceline-succinct-drop"/>
						<p id="yourprice-succinct-drop">Price</p>
						<p id="price-succinct-drop-before-succinct-drop">$200</p>
					</div>
				)}

				{succinctDropAddToCartSuccinctDrop && (
					<button id="succinct-drop-add-to-cart-succinct-drop" onClick={connectWallet}>
					ADD TO CART</button>
				)}
				{succinctDropAddToCartConnectedSuccinctDrop && (
					<button id="succinct-drop-add-to-cart-connected-succinct-drop" onClick={addSuccinctDropToCart}>
					ADD TO CART</button>
				)}
				{succinctDropAddedSuccinctDrop && (
					<button id="succinct-drop-added-succinct-drop">
					ADDED</button>	
				)}
				{succinctDropCollectedSuccinctDrop && (
					<button id="succinct-drop-collected-succinct-drop">
					COLLECTED</button>
				)}



					
				<div id="fingerprints">
					<p id="digital-fingerprints">DIGITAL FINGERPRINTS</p>
					<span>
						<button id="fingerprints-button"
							onClick={comingSoon}>
							<Image
							loader={imageLoader}
							alt=""
							width={25}  
							height={25}
							id="fingerprints-icon" 
							src="images/prototype/etherscan-logo.png"/>
						</button>	
					</span>
					<span>
						<button id="fingerprints-button"
							onClick={comingSoon}>
							<Image
							loader={imageLoader}
							alt=""
							width={25}  
							height={25}
							 id="fingerprints-icon"
							  src="images/prototype/ipfs.png"/>
						</button>	
					</span>
					<span>
						<button id="fingerprints-button"
							onClick={comingSoon}>
							<Image
							loader={imageLoader}
							alt=""
							width={25}  
							height={23}
							 id="fingerprints-icon"
							  src="images/prototype/ipfslite.png"/>
						</button>	
					</span>
				</div>	    		
											
			</div>		
		     
        </>
    );
}

export default SuccinctDrop;