"use client";

import React from "react";

// asset components (change below links after test)
import useSigner from "../../../state/signer";

// Change below link after test
import '../../app/css/prototype/seller-created.css';
import '../../app/css/modals/copiedlink.css';
import '../../app/css/modals/connect-wallet.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const SellerCreatedTest = () => {

{/*<!-- asset functions below -->*/}
	const {address, connectMetamask} = useSigner();

{/*<!-- asset constants above -->*/}

{/*<!-- loader functions below -->*/}
    const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }) => {
        return `/${src}?w=${width}&q=${quality || 100}`
    }
	const [imagesLoaded, setImagesLoaded] = useState({
		profilePhotoSellerCreated: false,
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
{/*<!-- loader functions above -->*/}


{/*<!-- useState constants below -->*/}
    const [showConnectWallet, setShowConnectWallet] = useState(false);
	const [showCopiedLink, setCopiedLink] = useState(false);

    const [cartLinkSellerCreated, setCartLinkSellerCreated] = useState(true);
	const [cartLinkConnectedSellerCreated, setCartLinkConnectedSellerCreated] = useState(false);

    const [noArtCreatedSellerCreated, setNoArtCreatedSellerCreated] = useState(true);
    const [artCreatedSellerCreated, setArtCreatedSellerCreated] = useState(false);

    const [blueOrangeAddToCartSellerCreated, setBlueOrangeAddToCartSellerCreated] = useState(true);
	const [blueOrangeAddToCartConnectedSellerCreated, setBlueOrangeAddToCartConnectedSellerCreated] = useState(false);
{/*<!-- useState constants above -->*/}


{/*<!-- Copy Links function/s below -->*/}

	const router = useRouter();
	const [fullUrl, setFullUrl] = useState('');
	useEffect(() => {
	  setFullUrl(`${window.location.origin}${'/test/seller-created'}`);
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

	const connectWalletFunction = async () => {
		await connectMetamask();
        setCartLinkSellerCreated(false);
        setCartLinkConnectedSellerCreated(true);
		setShowConnectWallet(false);
    
        setBlueOrangeAddToCartSellerCreated(false);
        setBlueOrangeAddToCartConnectedSellerCreated(true);    
        
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
            setCartLinkSellerCreated(false);
            setCartLinkConnectedSellerCreated(true);
            
            setCartLinkConnectedSellerCreated(true);
            setBlueOrangeAddToCartSellerCreated(false);
        
            setBlueOrangeAddToCartConnectedSellerCreated(true);
        }
    }, [walletConnectedSession]);

{/*<!-- Connect Wallet function/s above -->*/}

	
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

        {showConnectWallet && (
			<div id="connectWalletBuy">
				<div className="connect-wallet-content">
					<p id="connect-wallet-words">CONNECT WALLET</p>
					<button id="connectWallet"
						onClick={connectWalletFunction}>
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
{/*<!-- Modals Above -->*/}
				<div id="header-seller-created">
			
			{/*<!-- Change below link after test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-seller-created">
						<Image
						loader={imageLoader}
						alt=""
						height={16}
						width={15}
						id="arells-icon-seller-created" 
						src="images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>	
				{cartLinkSellerCreated && (
					<button id="cart-link-seller-created" onClick={connectWallet}>
						<Image
						loader={imageLoader}
						alt=""
						height={15}
						width={16} 
						id="cart-icon-seller-created" 
						src="images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedSellerCreated && (
					<Link legacyBehavior href="/prototype/cart">
						<a id="cart-link-connected-seller-created">
							<Image
							loader={imageLoader}
							alt=""
							height={15}
							width={16}
							id="cart-icon-seller-created" 
							src="images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}	                						
			</div>
			<Image
			loader={imageLoader}
			alt=""
			width={110}  
			height={35} 
			id="word-logo-seller-created" 
			src="images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-created">NEVER LOSE MONEY SELLING ART</p>
			<div id="profile-img-container-seller-created">
				<Image
				loader={imageLoader}
				onLoad={() => handleImageLoaded('profilePhotoSellerCreated')}
				alt=""
				width={100}  
				height={100}
				id="profile-photo-seller-created" 
				src="images/prototype/proto-banner.jpg"/>
			</div>	 
			<h1 id="name-seller-created">{address}</h1>  
			<p id="description-seller-created">Here rests life&apos;s abstractions captured in majestic endeavors.</p> 
			<div id="share-div-seller-created">
				<p id="share-div-desc-seller-created">SHARE</p>
				<button id="copy-link-seller-created"
				onClick={copyLink}>
					<Image
					loader={imageLoader}
					alt=""
					width={15}  
					height={8}
					id="copy-link-icon-seller-created" 
					src="images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-seller-created"/>
			<div id="created-collected-seller-created">
				<a id="created-seller-created">Created</a>	
			{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/test/seller-collected">
					<a id="collected-seller-created" >Collected</a>		
				</Link>	
			</div>
			{noArtCreatedSellerCreated && (
				<p id="no-art-buyer-collected">
					no art created
					<Image
					loader={imageLoader}
					alt=""
					width={27}  
					height={25}  
					id="cart-icon-collected-buyer-collected" 
					src="images/prototype/Add.png"/>
				</p>
			)}
			{artCreatedSellerCreated && (
				<div id="container-seller-created">
					{assets.map((asset) => (
						<div id="blue-orange-seller-created">
							{/*<!-- Change below link after test -->*/}
							<Link legacyBehavior href="/test/asset/test-asset">
								<a target="_self" id="photo-link-seller-created">
									<Image
									loader={imageLoader}
									onLoad={() => handleImageLoaded('photoSellerCreatedOne')}
									alt=""
									width={200}  
									height={200}  
									id="photo-seller-created" 
									src={asset.image}/>
								</a>
								<h3 id="asset-name"></h3> 
							</Link>	
								<div id="blue-orange-prices-before-seller-created">
									<p id="PAP-seller-created">Price After Purchase</p>
									<p id="PAP-blue-orange-before-seller-created">$1,800</p>
									<hr id="priceline-seller-created"/>
									<p id="yourprice-seller-created">Price</p>
									<p id="price-blue-orange-before-seller-created">${asset.price}</p>
								</div>	
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
								
						</div>									
						))
					}	
				</div>	
			)}
		     
        </>
    );
}

export default SellerCreatedTest;