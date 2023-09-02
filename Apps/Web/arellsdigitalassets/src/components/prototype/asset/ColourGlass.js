"use client";

// Change below link after test
import '../../../app/css/prototype/asset/colour-glass.css';
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

const ColourGlass = () => {

		//Loader Functions
		const [showLoading, setLoading] = useState(true);
		const [imagesLoaded, setImagesLoaded] = useState({
		photoColourGlass: false,
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
	  setFullUrl(`${window.location.origin}${'/prototype/asset/colour-glass'}`);
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
				src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}
{/*<!-- Modals Above -->*/}

			<div id="header-colour-glass">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-colour-glass">
							<Image
							alt=""
							height={16}
							width={15}
							 id="arells-icon-colour-glass"
							  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkColourGlass && (
						<button id="cart-link-colour-glass" onClick={connectWallet}>
							<Image
							alt=""
							height={15}
							width={16}
							 id="cart-icon-colour-glass"
							  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedColourGlass && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-connected-colour-glass">
								<Image
								alt=""
								height={15}
								width={16}
								 id="cart-icon-colour-glass"
								  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullColourGlass && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-full-colour-glass">
								<Image
								alt=""
								height={15}
								width={16} 
								 id="cart-icon-full-colour-glass"
								  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/shopping-cart-full.png"/>
							</a>	
						</Link>
					)}	
				</div>
				<Image
				alt=""
				width={110}  
				height={35}
				 id="word-logo-colour-glass"
				  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-colour-glass">NEVER LOSE MONEY SELLING ART</p>
				{walletConnectedDivColourGlass && (
					<div id="wallet-connected-div-colour-glass">
						<hr id="connected-line-colour-glass"/>
						<p id="wallet-connected-colour-glass" >
						WALLET CONNECTED</p>
						<hr id="connected-line-colour-glass"/>
					</div>
				)}

            <div id="colour-glass">
                <Image
				onLoad={() => handleImageLoaded('photoColourGlass')}
				alt=""
				width={400}  
				height={400}
				 id="photo-colour-glass"
				  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/3.jpg"/>
                <h3 id="name-colour-glass">Colour Glass</h3>
                <div id="share-div-colour-glass">
                    <p id="share-div-desc-colour-glass">SHARE</p> 
                    <button id="copy-link-colour-glass"
                    onClick={copyLink}>
                        <Image
						alt=""
						width={15}  
						height={8}
						id="copy-link-icon-colour-glass"
						 src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/link.png"/>
                        COPY LINK
                    </button>	
                </div>
                <div id="created-by-colour-glass">
                    <p id="creator-owner-desc-colour-glass">Created By</p>
                    <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-colour-glass">
                            Abstract Kadabra
                        </a>
					</Link>
                </div>
				{ownedByCreatorColourGlass && (
                    <div id="owned-by-creator-colour-glass" >
                        <p id="creator-owner-desc-colour-glass">Owned By</p> 
                        <Link legacyBehavior href="/prototype/seller-created">
                        <a id="creator-owner-link-colour-glass">
                            Abstract Kadabra
                        </a>
					</Link>
                    </div>
				)}
				{ownedByBuyerColourGlass && (
                    <div id="owned-by-buyer-colour-glass">
                        <p id="creator-owner-desc-colour-glass">Owned By</p> 
                        <Link legacyBehavior href="/prototype/buyer-collected">
                            <a id="creator-owner-link-layers" >
                                0x71C7656E...
                            </a>
					    </Link>
                    </div>
				)}
				<hr id="line-colour-glass"/>
				{colourGlassPricesBeforeColourGlass && (
                    <div id="colour-glass-prices-before-colour-glass">
                        <p id="PAP-colour-glass">Price After Purchase</p>
                        <p id="PAP-colour-glass-before-colour-glass">$750</p>
                        <hr id="priceline-colour-glass"/>
                        <p id="yourprice-colour-glass">Price</p>
                        <p id="price-colour-glass-before-colour-glass">$500</p>
                    </div>
				)}
				{colourGlassPricesAfterColourGlass && (
                    <div id="colour-glass-prices-after-colour-glass">
                        <p id="PAP-colour-glass">Price After Purchase</p>
                        <p id="PAP-colour-glass-after-colour-glass">$2,750</p>
                        <hr id="priceline-colour-glass"/>
                        <p id="yourprice-colour-glass">Price</p>
                        <p id="price-colour-glass-after-colour-glass">$750</p>
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
							<Image
							alt=""
							width={25}  
							height={25}
							 id="fingerprints-icon"
							  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/etherscan-logo.png"/>
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
							  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/ipfs.png"/>
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
							  src="https://d2d7sp5ao0zph4.cloudfront.net/icons&images/prototype/ipfslite.png"/>
						</button>	
					</span>
				</div>	    		
											
			</div>		
		     
        </>
    );
}

export default ColourGlass;