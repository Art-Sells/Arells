"use client";

// Change below link after test
import '../../../css/prototype/seller-created.css';
import '../../../css/modals/copiedlink.css';
import '../../../css/modals/connect-wallet.css';

//Loader Styles
import '../../../css/modals/loading/spinnerBackground.css';
import styles from '../../../css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const PrototypeSellerCreatedTest = () => {

		//Loader Functions
		const [showLoading, setLoading] = useState(true);
		const [imagesLoaded, setImagesLoaded] = useState({
		profilePhotoSellerCreated: false,
		photoSellerCreatedOne: false,
		photoSellerCreatedTwo: false,
		photoSellerCreatedThree: false,
		photoSellerCreatedFour: false,
		photoSellerCreatedFive: false,
		photoSellerCreatedSix: false,
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
	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkSellerCreated, setCartLinkSellerCreated] = useState(true);
	const [walletConnectedDivSellerCreated, setWalletConnectedDivSellerCreated] = useState(false);
	const [cartLinkFullSellerCreated, setCartLinkFullSellerCreated] = useState(false);

	const [cartLinkConnectedSellerCreated, setCartLinkConnectedSellerCreated] = useState(false);
	
	const [blueOrangeAddToCartSellerCreated, setBlueOrangeAddToCartSellerCreated] = useState(true);
	const [beachHousesAddToCartSellerCreated, setBeachHousesAddToCartSellerCreated] = useState(true);
	const [colourGlassAddToCartSellerCreated, setColourGlassAddToCartSellerCreated] = useState(true);
	const [layersAddToCartSellerCreated, setLayersAddToCartSellerCreated] = useState(true);
	const [succinctDropAddToCartSellerCreated, setSuccinctDropAddToCartSellerCreated] = useState(true);
	const [paintRainAddToCartSellerCreated, setPaintRainAddToCartSellerCreated] = useState(true);

	const[blueOrangeAddToCartConnectedSellerCreated, setBlueOrangeAddToCartConnectedSellerCreated] = useState(false);
	const[beachHousesAddToCartConnectedSellerCreated, setBeachHousesAddToCartConnectedSellerCreated] = useState(false);
	const[colourGlassAddToCartConnectedSellerCreated, setColourGlassAddToCartConnectedSellerCreated] = useState(false);
	const[layersAddToCartConnectedSellerCreated, setLayersAddToCartConnectedSellerCreated] = useState(false);
	const[succinctDropAddToCartConnectedSellerCreated, setSuccinctDropAddToCartConnectedSellerCreated] = useState(false);
	const[paintRainAddToCartConnectedSellerCreated, setPaintRainAddToCartConnectedSellerCreated] = useState(false);

	const [blueOrangeAddedSellerCreated, setBlueOrangeAddedSellerCreated] = useState(false);
	const [beachHousesAddedSellerCreated, setBeachHousesAddedSellerCreated] = useState(false);
	const [colourGlassAddedSellerCreated, setColourGlassAddedSellerCreated] = useState(false);
	const [layersAddedSellerCreated, setLayersAddedSellerCreated] = useState(false);
	const [succinctDropAddedSellerCreated, setSuccinctDropAddedSellerCreated] = useState(false);
	const [paintRainAddedSellerCreated, setPaintRainAddedSellerCreated] = useState(false);
	
	const [blueOrangePricesBeforeSellerCreated, setBlueOrangePricesBeforeSellerCreated] = useState(true);
	const [beachHousesPricesBeforeSellerCreated, setBeachHousesPricesBeforeSellerCreated] = useState(true);
	const [colourGlassPricesBeforeSellerCreated, setColourGlassPricesBeforeSellerCreated] = useState(true);
	const [layersPricesBeforeSellerCreated, setLayersPricesBeforeSellerCreated] = useState(true);
	const [succinctDropPricesBeforeSellerCreated, setSuccinctDropPricesBeforeSellerCreated] = useState(true);
	const [paintRainPricesBeforeSellerCreated, setPaintRainPricesBeforeSellerCreated] = useState(true);

	const [blueOrangePricesAfterSellerCreated, setBlueOrangePricesAfterSellerCreated] = useState(false);
	const [beachHousesPricesAfterSellerCreated, setBeachHousesPricesAfterSellerCreated] = useState(false);
	const [colourGlassPricesAfterSellerCreated, setColourGlassPricesAfterSellerCreated] = useState(false);
	const [layersPricesAfterSellerCreated, setLayersPricesAfterSellerCreated] = useState(false);
	const [succinctDropPricesAfterSellerCreated, setSuccinctDropPricesAfterSellerCreated] = useState(false);
	const [paintRainPricesAfterSellerCreated, setPaintRainPricesAfterSellerCreated] = useState(false);

	const[blueOrangeCollectedSellerCreated, setBlueOrangeCollectedSellerCreated] = useState(false);
	const[beachHousesCollectedSellerCreated, setBeachHousesCollectedSellerCreated] = useState(false);
	const[colourGlassCollectedSellerCreated, setColourGlassCollectedSellerCreated] = useState(false);
	const[layersCollectedSellerCreated, setLayersCollectedSellerCreated] = useState(false);
	const[succinctDropCollectedSellerCreated, setSuccinctDropCollectedSellerCreated] = useState(false);
	const[paintRainCollectedSellerCreated, setPaintRainCollectedSellerCreated] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype/seller-created'}`);
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
		
		setCartLinkSellerCreated(false);
		setWalletConnectedDivSellerCreated(true);
		
		setCartLinkConnectedSellerCreated(true);

		setBlueOrangeAddToCartSellerCreated(false);
		setBeachHousesAddToCartSellerCreated(false);
		setColourGlassAddToCartSellerCreated(false);
		setLayersAddToCartSellerCreated(false);
		setSuccinctDropAddToCartSellerCreated(false);
		setPaintRainAddToCartSellerCreated(false);
	
		setBlueOrangeAddToCartConnectedSellerCreated(true);
		setBeachHousesAddToCartConnectedSellerCreated(true);
		setColourGlassAddToCartConnectedSellerCreated(true);
		setLayersAddToCartConnectedSellerCreated(true);
		setSuccinctDropAddToCartConnectedSellerCreated(true);
		setPaintRainAddToCartConnectedSellerCreated(true);
		
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
			setCartLinkSellerCreated(false);
			setWalletConnectedDivSellerCreated(true);
			
			setCartLinkConnectedSellerCreated(true);
	
			setBlueOrangeAddToCartSellerCreated(false);
			setBeachHousesAddToCartSellerCreated(false);
			setColourGlassAddToCartSellerCreated(false);
			setLayersAddToCartSellerCreated(false);
			setSuccinctDropAddToCartSellerCreated(false);
			setPaintRainAddToCartSellerCreated(false);
		
			setBlueOrangeAddToCartConnectedSellerCreated(true);
			setBeachHousesAddToCartConnectedSellerCreated(true);
			setColourGlassAddToCartConnectedSellerCreated(true);
			setLayersAddToCartConnectedSellerCreated(true);
			setSuccinctDropAddToCartConnectedSellerCreated(true);
			setPaintRainAddToCartConnectedSellerCreated(true);
		}
	}, [walletConnectedSession]);
{/*<!-- Connect Wallet function/s above -->*/}

{/*<!-- Add To Cart function/s below -->*/}

	const [blueOrangeAdded, setBlueOrangeAdded] = useState(null);
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('blueOrangeAdded');
		setBlueOrangeAdded(sessionValue);
	}, []);
	function addBlueOrangeToCart() {

		setBlueOrangeAddToCartSellerCreated(false);
		setBlueOrangeAddedSellerCreated(true);

		setCartLinkConnectedSellerCreated(false);		
		setCartLinkFullSellerCreated(true);

		sessionStorage.setItem('blueOrangeAdded', 'true');
		setBlueOrangeAdded('true');
	}

	const [beachHousesAdded, setBeachHousesAdded] = useState(null);
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('beachHousesAdded');
		setBeachHousesAdded(sessionValue);
	}, []);
	function addBeachHousesToCart() {

		setBeachHousesAddToCartSellerCreated(false);
		setBeachHousesAddedSellerCreated(true);

		setCartLinkConnectedSellerCreated(false);		
		setCartLinkFullSellerCreated(true);

		sessionStorage.setItem('beachHousesAdded', 'true');
		setBeachHousesAdded('true');
	}	

	const [colourGlassAdded, setColourGlassAdded] = useState(null);
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('colourGlassAdded');
		setColourGlassAdded(sessionValue);
	}, []);
	function addColourGlassToCart() {

		setColourGlassAddToCartSellerCreated(false);
		setColourGlassAddedSellerCreated(true);

		setCartLinkConnectedSellerCreated(false);		
		setCartLinkFullSellerCreated(true);

		sessionStorage.setItem('colourGlassAdded', 'true');
		setColourGlassAdded('true');
	}	
	
	const [layersAdded, setLayersAdded] = useState(null);
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('layersAdded');
		setLayersAdded(sessionValue);
	}, []);
	function addLayersToCart() {

		setLayersAddToCartSellerCreated(false);
		setLayersAddedSellerCreated(true);

		setCartLinkConnectedSellerCreated(false);		
		setCartLinkFullSellerCreated(true);

		sessionStorage.setItem('layersAdded', 'true');
		setLayersAdded('true');
	}		

	const [succinctDropAdded, setSuccinctDropAdded] = useState(null);
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('succinctDropAdded');
		setSuccinctDropAdded(sessionValue);
	}, []);
	function addSuccinctDropToCart() {

		setSuccinctDropAddToCartSellerCreated(false);
		setSuccinctDropAddedSellerCreated(true);

		setCartLinkConnectedSellerCreated(false);		
		setCartLinkFullSellerCreated(true);

		sessionStorage.setItem('succinctDropAdded', 'true');
		setSuccinctDropAdded('true');
	}	
	
	const [paintRainAdded, setPaintRainAdded] = useState(null);
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('paintRainAdded');
		setPaintRainAdded(sessionValue);
	}, []);
	function addPaintRainToCart() {

		setPaintRainAddToCartSellerCreated(false);
		setPaintRainAddedSellerCreated(true);

		setCartLinkConnectedSellerCreated(false);		
		setCartLinkFullSellerCreated(true);

		sessionStorage.setItem('paintRainAdded', 'true');
		setPaintRainAdded('true');
	}		

{/*<!-- Add To Cart function/s above -->*/}


{/*<!-- Added/Purchased To function/s below -->*/}
	const [blueOrangePurchased, setBlueOrangePurchased] = useState(null);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('blueOrangePurchased');
		setBlueOrangePurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (blueOrangePurchased === 'true') {
			setBlueOrangePricesBeforeSellerCreated(false);
			setBlueOrangePricesAfterSellerCreated(true);

			setBlueOrangeAddToCartSellerCreated(false);		
			setBlueOrangeAddToCartConnectedSellerCreated(false);
			setBlueOrangeAddedSellerCreated(false);
			setBlueOrangeCollectedSellerCreated(true);
		}
	}, [blueOrangePurchased]);
	useEffect(() => {
		if (blueOrangeAdded === 'true') {
			setCartLinkConnectedSellerCreated(false);
			setCartLinkFullSellerCreated(true);
	
			setBlueOrangeAddToCartSellerCreated(false);		
			setBlueOrangeAddToCartConnectedSellerCreated(false);
			setBlueOrangeAddedSellerCreated(true);
		}
	}, [blueOrangeAdded]);

	const [beachHousesPurchased, setBeachHousesPurchased] = useState(false);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('beachHousesPurchased');
		setBeachHousesPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (beachHousesPurchased === 'true') {
			setBeachHousesPricesBeforeSellerCreated(false);
			setBeachHousesPricesAfterSellerCreated(true);

			setBeachHousesAddToCartSellerCreated(false);		
			setBeachHousesAddToCartConnectedSellerCreated(false);
			setBeachHousesAddedSellerCreated(false);
			setBeachHousesCollectedSellerCreated(true);
		}
	}, [beachHousesPurchased]);	
	useEffect(() => {
		if (beachHousesAdded === 'true') {
			setCartLinkConnectedSellerCreated(false);
			setCartLinkFullSellerCreated(true);
	
			setBeachHousesAddToCartSellerCreated(false);		
			setBeachHousesAddToCartConnectedSellerCreated(false);
			setBeachHousesAddedSellerCreated(true);
		}
	}, [beachHousesAdded]);

	const [colourGlassPurchased, setColourGlassPurchased] = useState(false);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('colourGlassPurchased');
		setColourGlassPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (colourGlassPurchased === 'true') {
			setColourGlassPricesBeforeSellerCreated(false);
			setColourGlassPricesAfterSellerCreated(true);

			setColourGlassAddToCartSellerCreated(false);		
			setColourGlassAddToCartConnectedSellerCreated(false);
			setColourGlassAddedSellerCreated(false);
			setColourGlassCollectedSellerCreated(true);
		}
	}, [colourGlassPurchased]);	
	useEffect(() => {
		if (colourGlassAdded === 'true') {
			setCartLinkConnectedSellerCreated(false);
			setCartLinkFullSellerCreated(true);
	
			setColourGlassAddToCartSellerCreated(false);		
			setColourGlassAddToCartConnectedSellerCreated(false);
			setColourGlassAddedSellerCreated(true);
		}
	}, [colourGlassAdded]);	

	const [layersPurchased, setLayersPurchased] = useState(false);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('layersPurchased');
		setLayersPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (layersPurchased === 'true') {
			setLayersPricesBeforeSellerCreated(false);
			setLayersPricesAfterSellerCreated(true);

			setLayersAddToCartSellerCreated(false);		
			setLayersAddToCartConnectedSellerCreated(false);
			setLayersAddedSellerCreated(false);
			setLayersCollectedSellerCreated(true);
		}
	}, [layersPurchased]);	
	useEffect(() => {
		if (layersAdded === 'true') {
			setCartLinkConnectedSellerCreated(false);
			setCartLinkFullSellerCreated(true);
	
			setLayersAddToCartSellerCreated(false);		
			setLayersAddToCartConnectedSellerCreated(false);
			setLayersAddedSellerCreated(true);
		}
	}, [layersAdded]);	
	
	const [succinctDropPurchased, setSuccinctDropPurchased] = useState(false);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('succinctDropPurchased');
		setSuccinctDropPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (succinctDropPurchased === 'true') {
			setSuccinctDropPricesBeforeSellerCreated(false);
			setSuccinctDropPricesAfterSellerCreated(true);

			setSuccinctDropAddToCartSellerCreated(false);		
			setSuccinctDropAddToCartConnectedSellerCreated(false);
			setSuccinctDropAddedSellerCreated(false);
			setSuccinctDropCollectedSellerCreated(true);
		}
	}, [succinctDropPurchased]);	
	useEffect(() => {
		if (succinctDropAdded === 'true') {
			setCartLinkConnectedSellerCreated(false);
			setCartLinkFullSellerCreated(true);
	
			setSuccinctDropAddToCartSellerCreated(false);		
			setSuccinctDropAddToCartConnectedSellerCreated(false);
			setSuccinctDropAddedSellerCreated(true);
		}
	}, [succinctDropAdded]);	

	const [paintRainPurchased, setPaintRainPurchased] = useState(false);	
	useEffect(() => {
		const sessionValue = sessionStorage.getItem('paintRainPurchased');
		setPaintRainPurchased(sessionValue);
	}, []);
	useEffect(() => {
		if (paintRainPurchased === 'true') {
			setPaintRainPricesBeforeSellerCreated(false);
			setPaintRainPricesAfterSellerCreated(true);

			setPaintRainAddToCartSellerCreated(false);		
			setPaintRainAddToCartConnectedSellerCreated(false);
			setPaintRainAddedSellerCreated(false);
			setPaintRainCollectedSellerCreated(true);
		}
	}, [paintRainPurchased]);	
	useEffect(() => {
		if (paintRainAdded === 'true') {
			setCartLinkConnectedSellerCreated(false);
			setCartLinkFullSellerCreated(true);
	
			setPaintRainAddToCartSellerCreated(false);		
			setPaintRainAddToCartConnectedSellerCreated(false);
			setPaintRainAddedSellerCreated(true);
		}
	}, [paintRainAdded]);		
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
						src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/coinbase-wallet-logo.png"/>
					</button>		
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
				src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}
{/*<!-- Modals Above -->*/}
				<div id="header-seller-created">
			
			{/*<!-- Change below link after test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-seller-created">
						<Image
						alt=""
						height={16}
						width={15}
						id="arells-icon-seller-created" 
						src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>							
				{cartLinkSellerCreated && (
					<button id="cart-link-seller-created" onClick={connectWallet}>
						<Image
						alt=""
						height={15}
						width={16} 
						id="cart-icon-seller-created" 
						src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedSellerCreated && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-connected-seller-created">
							<Image
							alt=""
							height={15}
							width={16}
							id="cart-icon-seller-created" 
							src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}		
				{cartLinkFullSellerCreated && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-full-seller-created">
							<Image
							alt=""
							height={15}
							width={16} 
							id="cart-icon-seller-created" 
							src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>	
				)}	
			</div>
			<Image
			alt=""
			width={110}  
			height={35} 
			id="word-logo-seller-created" 
			src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-created">NEVER LOSE MONEY SELLING ART</p>
			{walletConnectedDivSellerCreated && (
				<div id="wallet-connected-div-seller-created">
					<hr id="connected-line-seller-created"/>
					<p id="wallet-connected-seller-created" >
					WALLET CONNECTED</p>
					<hr id="connected-line-seller-created"/>
				</div>
			)}	
			<div id="profile-img-container-seller-created">
				<Image
				onLoad={() => handleImageLoaded('profilePhotoSellerCreated')}
				alt=""
				width={100}  
				height={100}
				id="profile-photo-seller-created" 
				src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/proto-banner.jpg"/>
			</div>	 
			<h1 id="name-seller-created">Abstract Kadabra</h1>  
			<p id="description-seller-created">Here rests life&apos;s abstractions captured in majestic endeavors.</p> 
			<div id="share-div-seller-created">
				<p id="share-div-desc-seller-created">SHARE</p>
				<button id="copy-link-seller-created"
				onClick={copyLink}>
					<Image
					alt=""
					width={15}  
					height={8}
					id="copy-link-icon-seller-created" 
					src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-seller-created"/>
			<div id="created-collected-seller-created">
				<a id="created-seller-created">Created</a>	
			{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/prototype/seller-collected">
					<a id="collected-seller-created" >Collected</a>		
				</Link>	
			</div>
			<div id="container-seller-created">
					<div id="blue-orange-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype/blue-orange">
							<a target="_self" id="photo-link-seller-created">
								<Image
								onLoad={() => handleImageLoaded('photoSellerCreatedOne')}
								alt=""
								width={200}  
								height={200}  
								id="photo-seller-created" 
								src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/1.jpg"/>
							</a>
						</Link>	
						{blueOrangePricesBeforeSellerCreated && (
							<div id="blue-orange-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-blue-orange-before-seller-created">1,800</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-blue-orange-before-seller-created">$1,200</p>
							</div>	
						)}	
						{blueOrangePricesAfterSellerCreated && (
							<div id="blue-orange-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-blue-orange-after-seller-created">$5,500</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-blue-orange-after-seller-created">$1,800</p>
							</div>	
						)}							
						{blueOrangeAddToCartSellerCreated && (
							<button id="blue-orange-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}	
						{blueOrangeAddToCartConnectedSellerCreated && (
							<button id="blue-orange-add-to-cart-connected-seller-created" 
							onClick={addBlueOrangeToCart}>
							ADD TO CART</button>
						)}	
						{blueOrangeAddedSellerCreated && (
							<button id="blue-orange-added-seller-created">
							ADDED</button>	
						)}	
						{blueOrangeCollectedSellerCreated && (
							<button id="blue-orange-collected-seller-created">
							COLLECTED</button>	
						)}								
					</div>
					<div id="beach-houses-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype/beach-houses">
							<a target="_self" id="photo-link-seller-created">
								<Image
								onLoad={() => handleImageLoaded('photoSellerCreatedTwo')}
								alt=""
								width={200}  
								height={200}  
								id="photo-seller-created" 
								src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/2.jpg"/>
							</a>
						</Link>	
						{beachHousesPricesBeforeSellerCreated && (
							<div id="beach-houses-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-beach-houses-before-seller-created">$2,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-beach-houses-before-seller-created">$300</p>
							</div>
						)}	
						{beachHousesPricesAfterSellerCreated && (
							<div id="beach-houses-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-beach-houses-after-seller-created">$2,500</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-beach-houses-after-seller-created">$2,000</p>
							</div>
						)}							
						{beachHousesAddToCartSellerCreated && (
							<button id="beach-houses-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{beachHousesAddToCartConnectedSellerCreated && (
							<button id="beach-houses-add-to-cart-connected-seller-created" 
							onClick={addBeachHousesToCart}>
							ADD TO CART</button>
						)}							
						{beachHousesAddedSellerCreated && (
							<button id="beach-houses-added-seller-created">
							ADDED</button>	
						)}							
						{beachHousesCollectedSellerCreated && (
							<button id="beach-houses-collected-seller-created">
							COLLECTED</button>	
						)}									     	
					</div>
					<div id="colour-glass-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype/colour-glass">
							<a target="_self" id="photo-link-seller-created">
								<Image
								onLoad={() => handleImageLoaded('photoSellerCreatedThree')}
								alt=""
								width={200}  
								height={200}  
								id="photo-seller-created" 
								src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/3.jpg"/>
							</a>
						</Link>	
						{colourGlassPricesBeforeSellerCreated && (
							<div id="colour-glass-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-colour-glass-before-seller-created">$750</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-colour-glass-before-seller-created">500</p>
							</div>
						)}								
						{colourGlassPricesAfterSellerCreated && (
							<div id="colour-glass-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-colour-glass-after-seller-created">$2,750</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-colour-glass-after-seller-created">$750</p>
							</div>
						)}								
						{colourGlassAddToCartSellerCreated && (
							<button id="colour-glass-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{colourGlassAddToCartConnectedSellerCreated && (
							<button id="colour-glass-add-to-cart-connected-seller-created" 
							onClick={addColourGlassToCart}>
							ADD TO CART</button>
						)}	
						{colourGlassAddedSellerCreated && (
							<button id="colour-glass-added-seller-created">
							ADDED</button>	
						)}								
						{colourGlassCollectedSellerCreated && (
							<button id="colour-glass-collected-seller-created">
							COLLECTED</button>	
						)}			     	
					</div>
					<div id="layers-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype/layers">
							<a target="_self" id="photo-link-seller-created">
								<Image
								onLoad={() => handleImageLoaded('photoSellerCreatedFour')}
								alt=""
								width={200}  
								height={200}  
								id="photo-seller-created" 
								src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/4.jpg"/>
							</a>
						</Link>	
						{layersPricesBeforeSellerCreated && (
							<div id="layers-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-layers-before-seller-created">$3,500</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-layers-before-seller-created">$1,500</p>
							</div>
						)}							
						{layersPricesAfterSellerCreated && (
							<div id="layers-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-layers-after-seller-created">$3,500</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-layers-after-seller-created">$4,000</p>
							</div>
						)}							
						{layersAddToCartSellerCreated && (
							<button id="layers-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{layersAddToCartConnectedSellerCreated && (
							<button id="layers-add-to-cart-connected-seller-created" 
							onClick={addLayersToCart}>
							ADD TO CART</button>
						)}								
						{layersAddedSellerCreated && (
							<button id="layers-added-seller-created">
							ADDED</button>	
						)}								
						{layersCollectedSellerCreated && (
							<button id="layers-collected-seller-created">
							COLLECTED</button>	
						)}							
					</div>
					<div id="succinct-drop-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype/succinct-drop">
							<a target="_self" id="photo-link-seller-created">
								<Image
								onLoad={() => handleImageLoaded('photoSellerCreatedFive')}
								alt=""
								width={200}  
								height={200}  
								id="photo-seller-created" 
								src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/5.jpg"/>
							</a>
						</Link>	
						{succinctDropPricesBeforeSellerCreated && (
							<div id="succinct-drop-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-succinct-drop-before-seller-created">$200</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-succinct-drop-before-seller-created">$100</p>
							</div>
						)}							
						{succinctDropPricesAfterSellerCreated && (
							<div id="succinct-drop-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-succinct-drop-after-seller-created">$1,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-succinct-drop-after-seller-created">$200</p>
							</div>
						)}	
						{succinctDropAddToCartSellerCreated && (
							<button id="succinct-drop-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{succinctDropAddToCartConnectedSellerCreated && (
							<button id="succinct-drop-add-to-cart-connected-seller-created" 
							onClick={addSuccinctDropToCart}>
							ADD TO CART</button>
						)}							
						{succinctDropAddedSellerCreated && (
							<button id="succinct-drop-added-seller-created">
							ADDED</button>	
						)}								
						{succinctDropCollectedSellerCreated && (
							<button id="succinct-drop-collected-seller-created">
							COLLECTED</button>	
						)}				     	
					</div>
					<div id="paint-rain-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype/paint-rain">
							<a target="_self" id="photo-link-seller-created">
								<Image
								onLoad={() => handleImageLoaded('photoSellerCreatedSix')}
								alt=""
								width={200}  
								height={200}  
								id="photo-seller-created" 
								src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/6.jpg"/>
							</a>
						</Link>			
						{paintRainPricesBeforeSellerCreated && (
							<div id="paint-rain-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-paint-rain-before-seller-created">$15,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-paint-rain-before-seller-created">$12,000</p>
							</div>
						)}							
						{paintRainPricesAfterSellerCreated && (
							<div id="paint-rain-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-paint-rain-after-seller-created">$20,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-paint-rain-after-seller-created">$15,000</p>
							</div>
						)}	
						{paintRainAddToCartSellerCreated && (
							<button id="paint-rain-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}	
						{paintRainAddToCartConnectedSellerCreated && (
							<button id="paint-rain-add-to-cart-connected-seller-created" 
							onClick={addPaintRainToCart}>
							ADD TO CART</button>
						)}	
						{paintRainAddedSellerCreated && (
							<button id="paint-rain-added-seller-created">
							ADDED</button>	
						)}	
						{paintRainCollectedSellerCreated && (
							<button id="paint-rain-collected-seller-created">
							COLLECTED</button>	
						)}			     	
					</div>
			</div>		
		     
        </>
    );
}

export default PrototypeSellerCreatedTest;