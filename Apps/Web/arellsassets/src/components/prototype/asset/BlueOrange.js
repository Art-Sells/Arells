"use client";

// Change below link after test
import '../../../app/css/prototype/asset/blue-orange.css';
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

const BlueOrange = () => {
	
	const imageLoader = ({ src, width, quality }) => {
		return `/${src}?w=${width}&q=${quality || 100}`
	  }

		//Loader Functions
		const [showLoading, setLoading] = useState(true);
		const [imagesLoaded, setImagesLoaded] = useState({
		   photoBlueOrange: false,
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
	  setFullUrl(`${window.location.origin}${'/prototype/asset/blue-orange'}`);
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

			<div id="header-blue-orange">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-blue-orange">
							<Image
							loader={imageLoader}
							alt=""
							height={16}
							width={15}
							 id="arells-icon-blue-orange" 
							 src="/images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkBlueOrange && (
						<button id="cart-link-blue-orange" onClick={connectWallet}>
							<Image
							loader={imageLoader}
							alt=""
							height={15}
							width={16}
							id="cart-icon-blue-orange"
							 src="/images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedBlueOrange && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-connected-blue-orange">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16}
								id="cart-icon-blue-orange" 
								src="/images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullBlueOrange && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-full-blue-orange">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16}
								 id="cart-icon-full-blue-orange"
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
				id="word-logo-blue-orange" 
				src="/images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-blue-orange">NEVER LOSE MONEY SELLING ART</p>
				{walletConnectedDivBlueOrange && (
					<div id="wallet-connected-div-blue-orange">
						<hr id="connected-line-blue-orange"/>
						<p id="wallet-connected-blue-orange" >
						WALLET CONNECTED</p>
						<hr id="connected-line-blue-orange"/>
					</div>
				)}

			<div id="blue-orange">
				<Image
				loader={imageLoader}
				onLoad={() => handleImageLoaded('photoBlueOrange')}
				alt=""
				width={400}  
				height={400}
				 id="photo-blue-orange"
				  src="/images/prototype/1.jpg"/>
				<h3 id="name-blue-orange">Blue Orange</h3> 
				<div id="share-div-blue-orange">
					<p id="share-div-desc-blue-orange">SHARE</p>
					<button id="copy-link-blue-orange"
					onClick={copyLink}>
						<Image
						loader={imageLoader}
						alt=""
						width={15}  
						height={8}
						id="copy-link-icon-blue-orange"
						 src="/images/prototype/link.png"/>
						COPY LINK
					</button>	
				</div>
				<div id="created-by-blue-orange">
					<p id="creator-owner-desc-blue-orange">Created By</p>
                    <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-blue-orange">
                            Abstract Kadabra
                        </a>
					</Link>
				</div>
				{ownedByCreatorBlueOrange && (
					<div id="owned-by-creator-blue-orange">
						<p id="creator-owner-desc-blue-orange">Owned By</p> 
                        <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-blue-orange">
                            Abstract Kadabra
                        </a>
					</Link>
					</div>
				)}
				{ownedByBuyerBlueOrange && (
					<div id="owned-by-buyer-blue-orange">
						<p id="creator-owner-desc-blue-orange">Owned By</p> 
                        <Link legacyBehavior href="/prototype/buyer-collected">
                            <a id="creator-owner-link-blue-orange" >
                                0x71C7656E...
                            </a>
					    </Link>
					</div>
				)}
				<hr id="line-blue-orange"/>
				{blueOrangePricesBeforeBlueOrange && (
					<div id="blue-orange-prices-before-blue-orange">
						<p id="PAP-blue-orange">Price After Purchase</p>
						<p id="PAP-blue-orange-before-blue-orange">$1,800</p>
						<hr id="priceline-blue-orange"/>
						<p id="yourprice-blue-orange">Price</p>
						<p id="price-blue-orange-before-blue-orange">$1,200</p>
					</div>	
				)}
				{blueOrangePricesAfterBlueOrange && (
					<div id="blue-orange-prices-after-blue-orange">
						<p id="PAP-blue-orange">Price After Purchase</p>
						<p id="PAP-blue-orange-after-blue-orange">$5,500</p>
						<hr id="priceline-blue-orange"/>
						<p id="yourprice-blue-orange">Price</p>
						<p id="price-blue-orange-after-blue-orange">$1,800</p>
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

export default BlueOrange;