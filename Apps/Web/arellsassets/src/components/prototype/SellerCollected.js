"use client";
import React from 'react';


// Change below link after test
import '../../app/css/prototype/seller-collected.css';
import '../../app/css/modals/copiedlink.css';
import '../../app/css/modals/connect-wallet.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const PrototypeSellerCollected = () => {

	const imageLoader = ({ src, width, quality }) => {
		return `/${src}?w=${width}&q=${quality || 100}`
	  }

	//Loader Functions
	const [showLoading, setLoading] = useState(true);
	const [imagesLoaded, setImagesLoaded] = useState({
	profilePhotoSellerCollected: false,
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
		
	const [cartLinkSellerCollected, setCartLinkSellerCollected] = useState(true);
	const [cartLinkConnectedSellerCollected, setCartLinkConnectedSellerCollected] = useState(false);
	const [cartLinkFullSellerCollected, setCartLinkFullSellerCollected] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivSellerCollected, setWalletConnectedDivSellerCollected] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype/seller-collected'}`);
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
		
		setCartLinkSellerCollected(false);
		setWalletConnectedDivSellerCollected(true);
		
		setCartLinkConnectedSellerCollected(true);
		
		sessionStorage.setItem('walletConnectedSession', 'true');
		setWalletConnectedSession('true');
	};	
	
	const [walletConnectedSession, setWalletConnectedSession] = useState(null);
	useEffect(() => {
	  const sessionValue = sessionStorage.getItem('walletConnectedSession');
	  setWalletConnectedSession(sessionValue);
	}, []);
	useEffect(() => {
		if (walletConnectedSession === 'true') {
			setCartLinkSellerCollected(false);
			setWalletConnectedDivSellerCollected(true);
			
			setCartLinkConnectedSellerCollected(true);
		}
	}, [walletConnectedSession]);
{/*<!-- Connect Wallet function/s above -->*/}

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
	useEffect(() => {
		if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		|| colourGlassAdded === 'true' || layersAdded === 'true'
		|| paintRainAdded === 'true' || succinctDropAdded === 'true') {
			setCartLinkConnectedSellerCollected(false);
			setCartLinkFullSellerCollected(true);
		}
	}, [blueOrangeAdded, beachHousesAdded,
		colourGlassAdded, layersAdded, paintRainAdded,
		succinctDropAdded]);	

{/*<!-- Add To Cart function/s above -->*/}
	
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
						src="images/prototype/coinbase-wallet-logo.png"/>
					</button>		
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


				<div id="header-seller-collected">
			
			{/*<!-- Change below link after test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-seller-collected">
						<Image
						loader={imageLoader}
						alt=""
						height={16}
						width={15}
						id="arells-icon-seller-collected" 
						src="images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>							
				{cartLinkSellerCollected && (
					<button id="cart-link-seller-collected" onClick={connectWallet}>
						<Image
						loader={imageLoader}
						alt=""
						height={15}
						width={16} 
						id="cart-icon-seller-collected" 
						src="images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedSellerCollected && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-connected-seller-collected">
							<Image
							loader={imageLoader}
							alt=""
							height={15}
							width={16}
							id="cart-icon-seller-collected" 
							src="images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}		
				{cartLinkFullSellerCollected && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-full-seller-collected">
							<Image
							loader={imageLoader}
							alt=""
							height={15}
							width={16} 
							id="cart-icon-seller-collected" 
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
			id="word-logo-seller-collected" 
			src="images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-collected">NEVER LOSE MONEY SELLING ART</p>
			{walletConnectedDivSellerCollected && (
				<div id="wallet-connected-div-seller-collected">
					<hr id="connected-line-seller-collected"/>
					<p id="wallet-connected-seller-collected" >
					WALLET CONNECTED</p>
					<hr id="connected-line-seller-collected"/>
				</div>
			)}	
			<div id="profile-img-container-seller-collected">
				<Image
				loader={imageLoader}
				onLoad={() => handleImageLoaded('profilePhotoSellerCollected')}
				alt=""
				width={100}  
				height={100}
				id="profile-photo-seller-collected" 
				src="images/prototype/proto-banner.jpg"/>
			</div>	 
			<h1 id="name-seller-collected">Abstract Kadabra</h1>  
			<p id="description-seller-collected">Here rests life&apos;s abstractions captured in majestic endeavors.</p> 
			<div id="share-div-seller-collected">
				<p id="share-div-desc-seller-collected">SHARE</p>
				<button id="copy-link-seller-collected"
				onClick={copyLink}>
					<Image
					loader={imageLoader}
					alt=""
					width={15}  
					height={8}
					id="copy-link-icon-seller-collected" 
					src="images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-seller-collected"/>
			<div id="created-collected-seller-collected">
				{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/prototype/seller-created">
					<a id="created-seller-collected" >Created</a>		
				</Link>	
				<a id="collected-seller-collected">Collected</a>	
			</div>
			<p id="no-art-seller-collected">
				no art collected
				<Image
				loader={imageLoader}
				alt=""
				width={27}  
				height={25} 
				id="cart-icon-collected-seller-collected" 
				src="images/prototype/shopping-cart-empty.png"/>
			</p>		
		     
        </>
    );
}

export default PrototypeSellerCollected;