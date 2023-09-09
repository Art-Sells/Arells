"use client";

// Change below link after test
import '../../../app/css/prototype/asset/paint-rain.css';
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

const PaintRain = () => {

	const imageLoader = ({ src, width, quality }) => {
		return `/${src}?w=${width}&q=${quality || 100}`
	  }

	//Loader Functions
	const [showLoading, setLoading] = useState(true);
	const [imagesLoaded, setImagesLoaded] = useState({
	photoPaintRain: false,
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
	
	const [cartLinkPaintRain, setCartLinkPaintRain] = useState(true);
	const [cartLinkConnectedPaintRain, setCartLinkConnectedPaintRain] = useState(false);
	const [cartLinkFullPaintRain, setCartLinkFullPaintRain] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivPaintRain, setWalletConnectedDivPaintRain] = useState(false);

	const [showComingSoon, setComingSoon] = useState(false);

	const [ownedByCreatorPaintRain, setOwnedByCreatorPaintRain] = useState(true);
	const [ownedByBuyerPaintRain, setOwnedByBuyerPaintRain] = useState(false);

	const [paintRainPricesBeforePaintRain, setPaintRainPricesBeforePaintRain] = useState(true);
	const [paintRainPricesAfterPaintRain, setPaintRainPricesAfterPaintRain] = useState(false);

	const [paintRainAddToCartPaintRain, setPaintRainAddToCartPaintRain] = useState(true);		
	const [paintRainAddToCartConnectedPaintRain, setPaintRainAddToCartConnectedPaintRain] = useState(false);
	const [paintRainAddedPaintRain, setPaintRainAddedPaintRain] = useState(false);
	const [paintRainCollectedPaintRain, setPaintRainCollectedPaintRain] = useState(false);


{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}
	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype/asset/paint-rain'}`);
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
		
		setCartLinkPaintRain(false);
		setWalletConnectedDivPaintRain(true);
		
		setCartLinkConnectedPaintRain(true);

		setPaintRainAddToCartPaintRain(false);		
		setPaintRainAddToCartConnectedPaintRain(true);
		
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
			setCartLinkPaintRain(false);
			setWalletConnectedDivPaintRain(true);
			
			setCartLinkConnectedPaintRain(true);

			setPaintRainAddToCartPaintRain(false);		
			setPaintRainAddToCartConnectedPaintRain(true);
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
	function addPaintRainToCart() {
		setPaintRainAddToCartPaintRain(false);
		setPaintRainAddedPaintRain(true);

		setCartLinkConnectedPaintRain(false);		
		setCartLinkFullPaintRain(true);

		sessionStorage.setItem('paintRainAdded', 'true');
		setPaintRainAdded('true');
	}	
	
{/*<!-- Add To Cart function/s above -->*/}


{/*<!-- Added/Purchased To function/s below -->*/}

	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedPaintRain(false);
			setCartLinkFullPaintRain(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);
	useEffect(() => {
		if (paintRainAdded === 'true') {
			setPaintRainAddToCartPaintRain(false);		
			setPaintRainAddToCartConnectedPaintRain(false);
			setPaintRainAddedPaintRain(true);
		}
	}, [paintRainAdded]);
		//Session Storage Getters below
	const [paintRainPurchased, setPaintRainPurchased] = useState(null);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('paintRainPurchased');
		setPaintRainPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (paintRainPurchased === 'true') {
			setPaintRainPricesBeforePaintRain(false);
			setPaintRainPricesAfterPaintRain(true);

			setOwnedByCreatorPaintRain(false);
			setOwnedByBuyerPaintRain(true);

			setPaintRainAddToCartPaintRain(false);		
			setPaintRainAddToCartConnectedPaintRain(false);
			setPaintRainAddedPaintRain(false);
			setPaintRainCollectedPaintRain(true);
		}
	}, [paintRainPurchased]);

{/*<!-- Added/Purchased To function/s above -->*/}
	
    return (
        <>

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
						loader={imageLoader}
						onLoad={() => handleImageLoaded('walletIcon')}
						id="wallet-icon"
						alt=""
						width={50}
						height={50}
						 src="/images/prototype/coinbase-wallet-logo.png"/>
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
				src="/images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}
{/*<!-- Modals Above -->*/}

			<div id="header-paint-rain">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-paint-rain">
							<Image
							loader={imageLoader}
							alt=""
							height={16}
							width={15}
							id="arells-icon-paint-rain" 
							src="/images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkPaintRain && (
						<button id="cart-link-paint-rain" onClick={connectWallet}>
							<Image
							loader={imageLoader}
							alt=""
							height={16}
							width={15}
							id="cart-icon-paint-rain" 
							src="/images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedPaintRain && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-connected-paint-rain">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16}
								id="cart-icon-paint-rain" 
								src="/images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullPaintRain && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-full-paint-rain">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16}
								id="cart-icon-full-paint-rain" 
								src="/images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<Image
				loader={imageLoader}
				alt=""
				width={110}  
				height={35}
				id="word-logo-paint-rain" 
				src="/images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-paint-rain">NEVER LOSE MONEY SELLING ART</p>
				{walletConnectedDivPaintRain && (
					<div id="wallet-connected-div-paint-rain">
						<hr id="connected-line-paint-rain"/>
						<p id="wallet-connected-paint-rain" >
						WALLET CONNECTED</p>
						<hr id="connected-line-paint-rain"/>
					</div>
				)}

            <div id="paint-rain">
                <Image
				loader={imageLoader}
				onLoad={() => handleImageLoaded('photoPaintRain')}
				alt=""
				width={400}  
				height={400}
				id="photo-paint-rain" 
				src="/icons&images/prototype/6.jpg"/>
                <h3 id="name-paint-rain">Colour Glass</h3>
                <div id="share-div-paint-rain">
                    <p id="share-div-desc-paint-rain">SHARE</p> 
                    <button id="copy-link-paint-rain"
                    onClick={copyLink}>
                        <Image
						loader={imageLoader}
						alt=""
						width={15}  
						height={8}
						id="copy-link-icon-paint-rain" 
						src="/images/prototype/link.png"/>
                        COPY LINK
                    </button>	
                </div>
                <div id="created-by-paint-rain">
                    <p id="creator-owner-desc-paint-rain">Created By</p>
                    <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-paint-rain">
                            Abstract Kadabra
                        </a>
					</Link>
                </div>
				{ownedByCreatorPaintRain && (
                    <div id="owned-by-creator-paint-rain" >
                        <p id="creator-owner-desc-paint-rain">Owned By</p> 
                        <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-paint-rain">
                            Abstract Kadabra
                        </a>
					</Link>
                    </div>
				)}
				{ownedByBuyerPaintRain && (
                    <div id="owned-by-buyer-paint-rain">
                        <p id="creator-owner-desc-paint-rain">Owned By</p> 
                        <Link legacyBehavior href="/prototype/buyer-collected">
                            <a id="creator-owner-link-paint-rain" >
                                0x71C7656E...
                            </a>
					    </Link>
                    </div>
				)}
				<hr id="line-paint-rain"/>
				{paintRainPricesBeforePaintRain && (
					<div id="paint-rain-prices-before-paint-rain">
						<p id="PAP-paint-rain">Price After Purchase</p>
						<p id="PAP-paint-rain-before-paint-rain">$15,000</p>
						<hr id="priceline-paint-rain"/>
						<p id="yourprice-paint-rain">Price</p>
						<p id="price-paint-rain-before-paint-rain">$12,000</p>
					</div>
				)}
				{paintRainPricesAfterPaintRain && (
					<div id="paint-rain-prices-after-paint-rain">
						<p id="PAP-paint-rain">Price After Purchase</p>
						<p id="PAP-paint-rain-after-paint-rain">$20,000</p>
						<hr id="priceline-paint-rain"/>
						<p id="yourprice-paint-rain">Price</p>
						<p id="price-paint-rain-after-paint-rain">$15,000</p>
					</div>
				)}

				{paintRainAddToCartPaintRain && (
					<button id="paint-rain-add-to-cart-paint-rain" onClick={connectWallet}>
					ADD TO CART</button>
				)}
				{paintRainAddToCartConnectedPaintRain && (
					<button id="paint-rain-add-to-cart-connected-paint-rain" onClick={addPaintRainToCart}>
					ADD TO CART</button>
				)}
				{paintRainAddedPaintRain && (
					<button id="paint-rain-added-paint-rain">
					ADDED</button>	
				)}
				{paintRainCollectedPaintRain && (
					<button id="paint-rain-collected-paint-rain">
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
							src="/images/prototype/etherscan-logo.png"/>
						</button>	
					</span>
					<span>
						<button id="fingerprints-button"
							onClick={comingSoon}>
							<Image
							loader={imageLoader}
							alt=""
							width={24}  
							height={25}
							id="fingerprints-icon" 
							src="/images/prototype/ipfs.png"/>
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
							  src="/images/prototype/ipfslite.png"/>
						</button>	
					</span>
				</div>	    		
											
			</div>		
		     
        </>
    );
}

export default PaintRain;