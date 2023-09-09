"use client";

// Change below link after test
import '../../../app/css/prototype/asset/beach-houses.css';
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

const BeachHouses = () => {

	//Loader Functions
	const [showLoading, setLoading] = useState(true);
	const [imagesLoaded, setImagesLoaded] = useState({
	photoBeachHouses: false,
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
	  setFullUrl(`${window.location.origin}${'/prototype/cart/beach-houses'}`);
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
						src="/icons&images/prototype/coinbase-wallet-logo.png"/>
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
				src="/icons&images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}
{/*<!-- Modals Above -->*/}

			<div id="header-beach-houses">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-beach-houses">
							<Image
							alt=""
							height={16}
							width={15}
							id="arells-icon-beach-houses" 
							src="/icons&images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkBeachHouses && (
						<button id="cart-link-beach-houses" onClick={connectWallet}>
							<Image
							alt=""
							height={15}
							width={16} 
							id="cart-icon-beach-houses" 
							src="/icons&images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedBeachHouses && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-connected-beach-houses">
								<Image
								alt=""
								height={15}
								width={16}
								id="cart-icon-beach-houses" 
								src="/icons&images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullBeachHouses && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-full-beach-houses">
								<Image
								alt=""
								height={15}
								width={16} 
								id="cart-icon-full-beach-houses" 
								src="/icons&images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<Image
				alt=""
				width={110}  
				height={35} 
				id="word-logo-beach-houses" 
				src="/icons&images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-beach-houses">NEVER LOSE MONEY SELLING ART</p>
				{walletConnectedDivBeachHouses && (
					<div id="wallet-connected-div-beach-houses">
						<hr id="connected-line-beach-houses"/>
						<p id="wallet-connected-beach-houses" >
						WALLET CONNECTED</p>
						<hr id="connected-line-beach-houses"/>
					</div>
				)}

			<div id="beach-houses">
				<Image
				onLoad={() => handleImageLoaded('photoBeachHouses')}
				alt=""
				width={400}  
				height={400}
				id="photo-beach-houses" 
				src="/icons&images/prototype/2.jpg"/>
				<h3 id="name-beach-houses">Beach Houses</h3> 
				<div id="share-div-beach-houses">
					<p id="share-div-desc-beach-houses">SHARE</p>
					<button id="copy-link-beach-houses"
					onClick={copyLink}>
						<Image
						alt=""
						width={15}  
						height={8}
						id="copy-link-icon-beach-houses" 
						src="/icons&images/prototype/link.png"/>
						COPY LINK
					</button>	
				</div>
				<div id="created-by-beach-houses">
					<p id="creator-owner-desc-beach-houses">Created By</p>
                    <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-beach-houses">
                            Abstract Kadabra
                        </a>
					</Link>
				</div>
				{ownedByCreatorBeachHouses && (
					<div id="owned-by-creator-beach-houses">
						<p id="creator-owner-desc-beach-houses">Owned By</p> 
                        <Link legacyBehavior href="/prototype/seller-created">
                            <a id="creator-owner-link-beach-houses">
                                Abstract Kadabra
                            </a>
                        </Link>
					</div>
				)}
				{ownedByBuyerBeachHouses && (
					<div id="owned-by-buyer-beach-houses">
						<p id="creator-owner-desc-beach-houses">Owned By</p> 
                        <Link legacyBehavior href="/prototype/buyer-collected">
                            <a id="creator-owner-link-beach-houses" >
                                0x71C7656E...
                            </a>
					    </Link>
					</div>
				)}
				<hr id="line-beach-houses"/>
				{beachHousesPricesBeforeBeachHouses && (
					<div id="beach-houses-prices-before-beach-houses">
						<p id="PAP-beach-houses">Price After Purchase</p>
						<p id="PAP-beach-houses-before-beach-houses">$2,000</p>
						<hr id="priceline-beach-houses"/>
						<p id="yourprice-beach-houses">Price</p>
						<p id="price-beach-houses-before-beach-houses">$300</p>
					</div>
				)}
				{beachHousesPricesAfterBeachHouses && (
					<div id="beach-houses-prices-after-beach-houses">
						<p id="PAP-beach-houses">Price After Purchase</p>
						<p id="PAP-beach-houses-after-beach-houses">$2,500</p>
						<hr id="priceline-beach-houses"/>
						<p id="yourprice-beach-houses">Price</p>
						<p id="price-beach-houses-after-beach-houses">$2,000</p>
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
							<Image
							alt=""
							width={25}  
							height={25}
							id="fingerprints-icon" 
							src="/icons&images/prototype/etherscan-logo.png"/>
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
							src="/icons&images/prototype/ipfs.png"/>
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
							src="/icons&images/prototype/ipfslite.png"/>
						</button>	
					</span>
				</div>	    		
											
			</div>		
		     
        </>
    );
}

export default BeachHouses;