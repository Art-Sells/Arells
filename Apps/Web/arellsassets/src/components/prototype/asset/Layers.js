"use client";

// Change below link after test
import '../../../app/css/prototype/asset/layers.css';
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

const Layers = () => {

		//Loader Functions
		const [showLoading, setLoading] = useState(true);
		const [imagesLoaded, setImagesLoaded] = useState({
		photoLayers: false,
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
	  setFullUrl(`${window.location.origin}${'/prototype/asset/layers'}`);
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

			<div id="header-layers">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-layers">
							<Image
							alt=""
							height={16}
							width={15}
							id="arells-icon-layers" 
							src="/images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkLayers && (
						<button id="cart-link-layers" onClick={connectWallet}>
							<Image
							alt=""
							height={15}
							width={16} 
							id="cart-icon-layers" 
							src="/images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedLayers && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-connected-layers">
								<Image
								alt=""
								height={15}
								width={16} 
								id="cart-icon-layers" 
								src="/icons&images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullLayers && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-full-layers">
								<Image
								alt=""
								height={15}
								width={16} 
								id="cart-icon-full-layers" 
								src="/icons&images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<Image
				alt=""
				width={110}  
				height={35}
				id="word-logo-layers" 
				src="/images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-layers">NEVER LOSE MONEY SELLING ART</p>
				{walletConnectedDivLayers && (
					<div id="wallet-connected-div-layers">
						<hr id="connected-line-layers"/>
						<p id="wallet-connected-layers" >
						WALLET CONNECTED</p>
						<hr id="connected-line-layers"/>
					</div>
				)}

            <div id="layers">
                <Image
				onLoad={() => handleImageLoaded('photoLayers')}
				alt=""
				width={400}  
				height={400} 
				id="photo-layers" 
				src="/images/prototype/4.jpg"/>
                <h3 id="name-layers">Layers</h3>
                <div id="share-div-layers">
                    <p id="share-div-desc-layers">SHARE</p> 
                    <button id="copy-link-layers"
                    onClick={copyLink}>
                        <Image
						alt=""
						width={15}  
						height={8}
						id="copy-link-icon-layers" 
						src="/images/prototype/link.png"/>
                        COPY LINK
                    </button>	
                </div>
                <div id="created-by-layers">
                    <p id="creator-owner-desc-layers">Created By</p>
                    <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-layers">
                            Abstract Kadabra
                        </a>
					</Link>
                </div>
				{ownedByCreatorLayers && (
                    <div id="owned-by-creator-layers" >
                        <p id="creator-owner-desc-layers">Owned By</p> 
                        <Link legacyBehavior href="/prototype/seller-created">
                            <a id="creator-owner-link-layers">
                                Abstract Kadabra
                            </a>
                        </Link>
                    </div>
				)}
				{ownedByBuyerLayers && (
                    <div id="owned-by-buyer-layers">
                        <p id="creator-owner-desc-layers">Owned By</p> 
                        <Link legacyBehavior href="/prototype/buyer-collected">
                            <a id="creator-owner-link-layers" >
                                0x71C7656E...
                            </a>
					    </Link>
                    </div>
				)}
				<hr id="line-layers"/>
				{layersPricesBeforeLayers && (
					<div id="layers-prices-before-layers">
						<p id="PAP-layers">Price After Purchase</p>
						<p id="PAP-layers-before-layers">$3,500</p>
						<hr id="priceline-layers"/>
						<p id="yourprice-layers">Price</p>
						<p id="price-layers-before-layers">$1,500</p>
					</div>
				)}
				{layersPricesAfterLayers && (
					<div id="layers-prices-after-layers">
						<p id="PAP-layers">Price After Purchase</p>
						<p id="PAP-layers-after-layers">$4,000</p>
						<hr id="priceline-layers"/>
						<p id="yourprice-layers">Price</p>
						<p id="price-layers-after-layers">$3,500</p>
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
							<Image
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

export default Layers;