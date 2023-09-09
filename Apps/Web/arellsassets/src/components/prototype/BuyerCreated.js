"use client";

// Change below link after test
import '../../app/css/prototype/buyer-created.css';
import '../../app/css/modals/copiedlink.css';
import '../../app/css/modals/connect-wallet.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const PrototypeBuyerCreated = () => {

			//Loader Functions
			const [showLoading, setLoading] = useState(true);
			const [imagesLoaded, setImagesLoaded] = useState({
			profilePhotoBuyerCreated: false,
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
		
	const [cartLinkBuyerCreated, setCartLinkBuyerCreated] = useState(true);
	const [cartLinkConnectedBuyerCreated, setCartLinkConnectedBuyerCreated] = useState(false);
	const [cartLinkFullBuyerCreated, setCartLinkFullBuyerCreated] = useState(false);

	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [walletConnectedDivBuyerCreated, setWalletConnectedDivBuyerCreated] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype/buyer-created'}`);
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
		
		setCartLinkBuyerCreated(false);
		setWalletConnectedDivBuyerCreated(true);
		
		setCartLinkConnectedBuyerCreated(true);
		
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
			setCartLinkBuyerCreated(false);
			setWalletConnectedDivBuyerCreated(true);
			
			setCartLinkConnectedBuyerCreated(true);
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
			setCartLinkConnectedBuyerCreated(false);
			setCartLinkFullBuyerCreated(true);
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
						id="wallet-icon"
						alt=""
						width={50}
						height={50}  
						 src="/images/prototype/coinbase-wallet-logo.png"/>
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
				src="/images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}
{/*<!-- Modals Above -->*/}


		<div id="prototype-buyer-created-wrapper">
				<div id="header-buyer-created">
			
			{/*<!-- Change below link after test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-buyer-created">
						<Image
						alt=""
						height={16}
						width={15}
						id="arells-icon-buyer-created" 
						src="/images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>							
				{cartLinkBuyerCreated && (
					<button id="cart-link-buyer-created" onClick={connectWallet}>
						<Image
						alt=""
						height={15}
						width={16} 
						id="cart-icon-buyer-created" 
						src="/images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedBuyerCreated && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-connected-buyer-created">
							<Image
							alt=""
							height={15}
							width={16}
							id="cart-icon-buyer-created" 
							src="/images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}		
				{cartLinkFullBuyerCreated && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-full-buyer-created">
							<Image
							alt=""
							height={15}
							width={16} 
							id="cart-icon-buyer-created" 
							src="/images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>	
				)}	
			</div>
			<Image
			alt=""
			width={110}  
			height={35} 
			id="word-logo-buyer-created" 
			src="/images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-buyer-created">NEVER LOSE MONEY SELLING ART</p>
			{walletConnectedDivBuyerCreated && (
				<div id="wallet-connected-div-buyer-created">
					<hr id="connected-line-buyer-created"/>
					<p id="wallet-connected-buyer-created" >
					WALLET CONNECTED</p>
					<hr id="connected-line-buyer-created"/>
				</div>
			)}	
			<div id="profile-img-container-buyer-created">
				<Image
				onLoad={() => handleImageLoaded('profilePhotoBuyerCreated')}
				alt=""
				width={100}  
				height={100}
				id="profile-photo-buyer-created" 
				src="/images/prototype/Unnamed-Icon.jpg"/>
			</div>	 
			<h1 id="name-buyer-created">Unnamed</h1>  
			<p id="description-buyer-created">Creator & Collector</p> 
			<div id="share-div-buyer-created">
				<p id="share-div-desc-buyer-created">SHARE</p>
				<button id="copy-link-buyer-created"
				onClick={copyLink}>
					<Image
					alt=""
					width={15}  
					height={8} 
					id="copy-link-icon-buyer-created" 
					src="/images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-buyer-created"/>
			<div id="created-collected-buyer-created">
				<a id="created-buyer-created">Created</a>	
				{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/prototype/buyer-collected">
					<a id="collected-buyer-created" >Collected</a>		
				</Link>	
			</div>
			<p id="no-art-buyer-created">
				no art created
				<Image
				alt=""
				width={25}  
				height={25}
				id="cart-icon-collected-buyer-created" 
				src="/images/prototype/Add.png"/>
			</p>

		</div>			
		     
        </>
    );
}

export default PrototypeBuyerCreated;