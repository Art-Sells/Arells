"use client";

// Change below link after test
import '../../app/css/prototype/buyer-collected.css';
import '../../app/css/modals/copiedlink.css';
import '../../app/css/modals/connect-wallet.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const PrototypeBuyerCollected = () => {

		//Loader Functions
		const [showLoading, setLoading] = useState(true);
		const [imagesLoaded, setImagesLoaded] = useState({
		profilePhotoBuyerCollected: false,
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

		//Asset Loading Functions Below
		const [showLoadingAssetCollected, setLoadingAssetCollected] = useState(false);

		const [imagesOneLoaded, setImagesOneLoaded] = useState({
			photoBuyerCollectedOne: false,
		});
		const handleImageOneLoaded = (imageName) => {
		setImagesOneLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesOneLoaded).every(Boolean)) {
			setLoadingAssetCollected(false);
		}
		}, [imagesOneLoaded]);

		const [imagesTwoLoaded, setImagesTwoLoaded] = useState({
			photoBuyerCollectedTwo: false,
		});
		const handleImageTwoLoaded = (imageName) => {
		setImagesTwoLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesTwoLoaded).every(Boolean)) {
			setLoadingAssetCollected(false);
		}
		}, [imagesTwoLoaded]);

		const [imagesThreeLoaded, setImagesThreeLoaded] = useState({
			photoBuyerCollectedThree: false,
		});
		const handleImageThreeLoaded = (imageName) => {
		setImagesThreeLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesThreeLoaded).every(Boolean)) {
			setLoadingAssetCollected(false);
		}
		}, [imagesThreeLoaded]);
		
		const [imagesFourLoaded, setImagesFourLoaded] = useState({
			photoBuyerCollectedFour: false,
		});
		const handleImageFourLoaded = (imageName) => {
		setImagesFourLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesFourLoaded).every(Boolean)) {
			setLoadingAssetCollected(false);
		}
		}, [imagesFourLoaded]);

		const [imagesFiveLoaded, setImagesFiveLoaded] = useState({
			photoBuyerCollectedFive: false,
		});
		const handleImageFiveLoaded = (imageName) => {
		setImagesFiveLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesFiveLoaded).every(Boolean)) {
			setLoadingAssetCollected(false);
		}
		}, [imagesFiveLoaded]);

		const [imagesSixLoaded, setImagesSixLoaded] = useState({
			photoBuyerCollectedSix: false,
		});
		const handleImageSixLoaded = (imageName) => {
		setImagesSixLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesSixLoaded).every(Boolean)) {
			setLoadingAssetCollected(false);
		}
		}, [imagesSixLoaded]);





{/*<!-- useState constants below -->*/}
	const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [showCopiedLink, setCopiedLink] = useState(false);
	
	const [cartLinkBuyerCollected, setCartLinkBuyerCollected] = useState(true);
	const [walletConnectedDivBuyerCollected, setWalletConnectedDivBuyerCollected] = useState(false);
	const [cartLinkFullBuyerCollected, setCartLinkFullBuyerCollected] = useState(false);

	const [cartLinkConnectedBuyerCollected, setCartLinkConnectedBuyerCollected] = useState(false);

	const [noArtBuyerCollected, setNoArtBuyerCollected] = useState(true);
	const [collectedItemsBuyerCollected, setCollectedItemsBuyerCollected] = useState(false);

	const[blueOrangeBuyerCollected, setBlueOrangeBuyerCollected] = useState(false);
	const[beachHousesBuyerCollected, setBeachHousesBuyerCollected] = useState(false);
	const[colourGlassBuyerCollected, setColourGlassBuyerCollected] = useState(false);
	const[layersBuyerCollected, setLayersBuyerCollected] = useState(false);
	const[succinctDropBuyerCollected, setSuccinctDropBuyerCollected] = useState(false);
	const[paintRainBuyerCollected, setPaintRainBuyerCollected] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/prototype/buyer-collected'}`);
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
		
		setCartLinkBuyerCollected(false);
		setWalletConnectedDivBuyerCollected(true);
		
		setCartLinkConnectedBuyerCollected(true);
		
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
			setCartLinkBuyerCollected(false);
			setWalletConnectedDivBuyerCollected(true);
			
			setCartLinkConnectedBuyerCollected(true);
		}
	}, [walletConnectedSession]);
{/*<!-- Connect Wallet function/s above -->*/}

{/*<!-- Added/Purchased To function/s below -->*/}
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
			const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
			const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
			const layersAdded = sessionStorage.getItem('layersAdded');
			const paintRainAdded = sessionStorage.getItem('paintRainAdded');
			const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');
			if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
			|| colourGlassAdded === 'true' || layersAdded === 'true'
			|| paintRainAdded === 'true' || succinctDropAdded == 'true') {
				setCartLinkConnectedBuyerCollected(false);
				setCartLinkFullBuyerCollected(true);
			}
		  }
	}, []);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const blueOrangePurchased = sessionStorage.getItem('blueOrangePurchased');
			const beachHousesPurchased = sessionStorage.getItem('beachHousesPurchased');
			const colourGlassPurchased = sessionStorage.getItem('colourGlassPurchased');
			const layersPurchased = sessionStorage.getItem('layersPurchased');
			const paintRainPurchased = sessionStorage.getItem('paintRainPurchased');
			const succinctDropPurchased = sessionStorage.getItem('succinctDropPurchased');	
			if (blueOrangePurchased === 'true') {
				setNoArtBuyerCollected(false);
				setLoadingAssetCollected(true);
	
				setCollectedItemsBuyerCollected(true);
				setBlueOrangeBuyerCollected(true);
			}
			if (beachHousesPurchased === 'true') {
				setNoArtBuyerCollected(false);
				setLoadingAssetCollected(true);
	
				setCollectedItemsBuyerCollected(true);
				setBeachHousesBuyerCollected(true);
			}
			if (colourGlassPurchased === 'true') {
				setNoArtBuyerCollected(false);
				setLoadingAssetCollected(true);
	
				setCollectedItemsBuyerCollected(true);
				setColourGlassBuyerCollected(true);
			}
			if (layersPurchased === 'true') {
				setNoArtBuyerCollected(false);
				setLoadingAssetCollected(true);
	
				setCollectedItemsBuyerCollected(true);
				setLayersBuyerCollected(true);
			}
			if (paintRainPurchased === 'true') {
				setNoArtBuyerCollected(false);
				setLoadingAssetCollected(true);
	
				setCollectedItemsBuyerCollected(true);
				setPaintRainBuyerCollected(true);
			}
			if (succinctDropPurchased === 'true') {
				setNoArtBuyerCollected(false);
				setLoadingAssetCollected(true);
	
				setCollectedItemsBuyerCollected(true);
				setSuccinctDropBuyerCollected(true);
			}
		  }
	}, []);
	
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
		{showLoadingAssetCollected && (
			<div id="spinnerBackground">
			<Image 
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="/images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingAssetCollected && (
			<div className={styles.spinner}></div>
		)}

{/*<!-- Modals Above -->*/}

			<div id="header-buyer-collected">
			
			{/*<!-- Change Link Below After Test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-buyer-collected">
						<Image
						alt=""
						height={16}
						width={15}
						id="arells-icon-buyer-collected" 
						src="/images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>	
				{cartLinkBuyerCollected && (
					<button id="cart-link-buyer-collected" onClick={connectWallet}>
						<Image
						alt=""
						height={15}
						width={16} 
						id="cart-icon-buyer-collected" 
						src="/images/prototype/shopping-cart-empty.png"/>
					</button>					
				)}
				{cartLinkConnectedBuyerCollected && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-connected-buyer-collected">
							<Image
							alt=""
							height={15}
							width={16}
							id="cart-icon-buyer-collected" 
							src="/images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>
				
				)}
				{cartLinkFullBuyerCollected && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-full-buyer-collected">
							<Image
							alt=""
							height={15}
							width={16} 
							id="cart-icon-buyer-collected" 
							src="/images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>
				
				)}		
			</div>
			<Image
			alt=""
			width={110}  
			height={35}  
			id="word-logo-buyer-collected" 
			src="/images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-buyer-collected">NEVER LOSE MONEY SELLING ART</p>
			{walletConnectedDivBuyerCollected && (
				<div id="wallet-connected-div-buyer-collected">
					<hr id="connected-line-buyer-collected"/>
					<p id="wallet-connected-buyer-collected" >
					WALLET CONNECTED</p>
					<hr id="connected-line-buyer-collected"/>
				</div>				
			)}
			<div id="profile-img-container-buyer-collected">
				<Image
				onLoad={() => handleImageLoaded('profilePhotoBuyerCollected')}
				alt=""
				width={100}  
				height={100}
				id="profile-photo-buyer-collected" 
				src="/images/prototype/Unnamed-Icon.jpg"/>
			</div>	 
			<h1 id="name-buyer-collected">Unnamed</h1>  
			<p id="description-buyer-collected">Creator & Collector</p> 
			<div id="share-div-buyer-collected">
				<p id="share-div-desc-buyer-collected">SHARE</p>
				<button id="copy-link-buyer-collected"
					onClick={copyLink}>
					<Image
					alt=""
					width={15}  
					height={8}
					id="copy-link-icon-buyer-collected" 
					src="/images/prototype/link.png"/>
					COPY LINK</button>	
			</div>		
			<hr id="profileline-buyer-collected"/>
			<div id="created-collected-buyer-collected">
				{/*<!-- Change Link Below After Test -->*/}
				<Link legacyBehavior href="/prototype/buyer-created">
					<a id="created-buyer-collected">Created</a>		
				</Link>
				<a id="collected-buyer-collected">Collected</a>	
			</div>
			{noArtBuyerCollected && (
				<p id="no-art-buyer-collected">
					no art collected
					<Image
					alt=""
					width={27}  
					height={25}  
					id="cart-icon-collected-buyer-collected" 
					src="/images/prototype/shopping-cart-empty.png"/>
				</p>
			)}
			{collectedItemsBuyerCollected && (
				<div id="collected-items-buyer-collected">
					{blueOrangeBuyerCollected && (
						<div id="blue-orange-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype/asset/blue-orange">
								<a target="_self" id="photo-link-buyer-collected">
									<Image
									onLoad={() => handleImageOneLoaded('photoBuyerCollectedOne')}
									alt=""
									width={150}  
									height={150}  
									id="photo-buyer-collected" 
									src="/images/prototype/1.jpg"/>
								</a>								
							</Link>
							<div id="prices-buyer-collected">
								<div id="blue-orange-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-blue-orange-after-buyer-collected">$5,500</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-blue-orange-after-buyer-collected">$1,800</p>
								</div>			  		
							</div>		  		
						</div>
					)}
					{beachHousesBuyerCollected && (
						<div id="beach-houses-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype/asset/beach-houses">
								<a target="_self" id="photo-link-buyer-collected">
									<Image
									onLoad={() => handleImageTwoLoaded('photoBuyerCollectedTwo')}
									alt=""
									width={150}  
									height={150}  
									id="photo-buyer-collected" 
									src="/images/prototype/2.jpg"/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="beach-houses-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-beach-houses-after-buyer-collected">$2,500</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-beach-houses-after-buyer-collected">$2,000</p>
								</div>			  		
							</div>     	
						</div>
					)}
					{colourGlassBuyerCollected && (
						<div id="colour-glass-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype/asset/colour-glass">
								<a target="_self" id="photo-link-buyer-collected">
									<Image
									onLoad={() => handleImageThreeLoaded('photoBuyerCollectedThree')}
									alt=""
									width={150}  
									height={150}  
									id="photo-buyer-collected" 
									src="/images/prototype/3.jpg"/>
								</a>								
							</Link>
							<div id="prices-buyer-collected">
								<div id="colour-glass-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-colour-glass-after-buyer-collected">$2,750</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-colour-glass-after-buyer-collected">$750</p>
								</div>  		  		
							</div>   	
						</div>
					)} 
					{layersBuyerCollected && (
						<div id="layers-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype/asset/layers">
								<a target="_self" id="photo-link-buyer-collected">
									<Image
									onLoad={() => handleImageFourLoaded('photoBuyerCollectedFour')}
									alt=""
									width={150}  
									height={150}  
									id="photo-buyer-collected" 
									src="/images/prototype/4.jpg"/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="layers-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-layers-after-buyer-collected">$4,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-layers-after-buyer-collected">$3,500</p>
								</div>		  		
							</div>
						</div>
					)}
					{succinctDropBuyerCollected && (
						<div id="succinct-drop-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype/asset/succinct-drop">
								<a target="_self" id="photo-link-buyer-collected">
									<Image
									onLoad={() => handleImageFiveLoaded('photoBuyerCollectedFive')}
									alt=""
									width={150}  
									height={150}  
									id="photo-buyer-collected" 
									src="/images/prototype/5.jpg"
									/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="succinct-drop-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-succinct-drop-after-buyer-collected">$1,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-succinct-drop-after-buyer-collected">$200</p>
								</div>				  		
							</div>     	
						</div>
					)}
					{paintRainBuyerCollected && (
						<div id="paint-rain-buyer-collected">
						{/*<!-- Change Link Below After Test -->*/}
							<Link legacyBehavior href="/prototype/asset/paint-rain">
								<a target="_self" id="photo-link-buyer-collected">
									<Image
									onLoad={() => handleImageSixLoaded('photoBuyerCollectedSix')}
									alt=""
									width={150}  
									height={150}  
									id="photo-buyer-collected" 
									src="/images/prototype/6.jpg"/>
								</a>
							</Link>
							<div id="prices-buyer-collected">
								<div id="paint-rain-prices-after-buyer-collected">
									<p id="PAP-buyer-collected">Price After Purchase</p>
									<p id="PAP-paint-rain-after-buyer-collected">$20,000</p>
									<hr id="priceline-buyer-collected"/>
									<p id="yourprice-buyer-collected">Price</p>
									<p id="price-paint-rain-after-buyer-collected">$15,000</p>
								</div>			  		
							</div>     	
						</div>
					)}
				</div>
			)}		
		     
        </>
    );
}

export default PrototypeBuyerCollected;