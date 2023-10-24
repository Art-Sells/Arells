'use client'

import React from "react";

// asset components (change below links after test)
import useSigner from "../../state/signer";
import useNFTMarket from "../../state/nft-market";
import NFTCard from "./NFTCard";

// Change below link after test
import '../../app/css/prototype/seller-created.css';
import '../../app/css/prototype/buyer-collected.css';
import '../../app/css/modals/copiedlink.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NFT } from "../../state/nft-market/interfaces";



const SellerCreatedTest = () => {

//loader functions below 
    const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };
	const [imagesLoaded, setImagesLoaded] = useState({
		profilePhotoSellerCreated: false,
	});
    const handleImageLoaded = (imageName: string) => {
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
// loader functions above


// useState constants below
	const [showCopiedLink, setCopiedLink] = useState(false);

    const [cartLinkSellerCreated, setCartLinkSellerCreated] = useState(true);
	const [cartLinkConnectedSellerCreated, setCartLinkConnectedSellerCreated] = useState(false);

    const [noArtCreatedSellerCreated, setNoArtCreatedSellerCreated] = useState(true);
    const [artCreatedSellerCreated, setArtCreatedSellerCreated] = useState(false);
// useState constants above

// Copy Links function/s below
	const [fullUrl, setFullUrl] = useState<string>('');
	useEffect(() => {
		setFullUrl(window.location.href);
	}, []);
	const copyLink = () => {
		navigator.clipboard.writeText(fullUrl).then(() => {
			setCopiedLink(true);
		});
	};
  
	const closeCopiedLink = () => {
	  setCopiedLink(false);
	};
// Copy Links function/s above

// asset functions below
	const { address, connectWallet} = useSigner();
	const {createdNFTs} = useNFTMarket();
	useEffect(() => {
		if (createdNFTs) {
			setNoArtCreatedSellerCreated(false);
			setArtCreatedSellerCreated(true);
		}
	}, [createdNFTs]);
// asset constants above

// Cart Changing function/s below 
    useEffect(() => {
        if (address) {
            setCartLinkSellerCreated(false);
            setCartLinkConnectedSellerCreated(true);
        }
		else if (!address){
			setCartLinkSellerCreated(true);
            setCartLinkConnectedSellerCreated(false);	
		}
    }, [address]);
// Cart Changing function/s above 

	
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
				src="images/market/Market-Default-Icon.jpg"/>
			</div>	 
			<h1 id="name-seller-created">Unnamed Store {address}</h1>  
			<p id="description-seller-created">Creations and Collections</p> 
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
					{Array.isArray(createdNFTs) && createdNFTs.map((
						nft: NFT
						) => <NFTCard nft={nft} key={nft.id} />)}
				</div>	
			)}
		     
        </>
    );
}

export default SellerCreatedTest;