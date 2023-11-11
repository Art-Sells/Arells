'use client'

import React from "react";
import router from 'next/router';

// asset components (change below links after test)
import useSigner from "../../state/signer";
import useNFTMarket from "../../state/nft-market";
import AssetStoreHolder from "./Asset/StoreAssetHolder";

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

const StoreNotSelling = () => {
	

//loader functions below 
    const [showLoading, setLoading] = useState(false);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };
	// const [imagesLoaded, setImagesLoaded] = useState({
	// 	arellLogoSelling: false,
	// });
    // const handleImageLoaded = (imageName: string) => {
    //     setImagesLoaded(prevState => ({
    //         ...prevState,
    //         [imageName]: true 
    //     }));
    // };
	// useEffect(() => {
	// 	if (Object.values(imagesLoaded).every(Boolean)) {
	// 		setLoading(false);
	// 	}
	// }, [imagesLoaded]);
// loader functions above


// useState constants below
    const [noArtCreatedSellerCreated, setNoArtCreatedSellerCreated] = useState(false);
    const [artCreatedSellerCreated, setArtCreatedSellerCreated] = useState(false);
// useState constants above

// asset functions below
	const { address, connectWallet} = useSigner();
    const { createdNFTs } = useNFTMarket();

    useEffect(() => {
        if (createdNFTs && createdNFTs.length > 0) {
            // Assuming the first NFT's storeAddress is what you need
            const storeAddress = createdNFTs[0].storeAddress;
            // Update the URL
            router.push(`/${storeAddress}`);
        }
    }, [createdNFTs, router]);
	useEffect(() => {
		if (createdNFTs) {
			setNoArtCreatedSellerCreated(false);
			setArtCreatedSellerCreated(true);
		}
		else {
			setNoArtCreatedSellerCreated(true);
			setArtCreatedSellerCreated(false);
		}
	}, [createdNFTs]);
// asset constants above

	
    return (
        <>	

{/*<!-- Modals below link after test -->*/}

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
			<Image
			loader={imageLoader}
			// onLoad={() => handleImageLoaded('arellsLogoSelling')}
			alt=""
			width={110}  
			height={35} 
			id="word-logo-seller-created" 
			src="images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-created">NEVER LOSE MONEY SELLING ART</p>
			<hr id="profileline-seller-created"/>
			<div id="created-collected-seller-created">
				<a id="created-seller-created">Selling</a>	
			{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/test/seller-collected">
					<a id="collected-seller-created" >Owned</a>		
				</Link>	
			</div>
			{noArtCreatedSellerCreated && (
				<p id="no-art-buyer-collected">
					no art to sell
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
					{createdNFTs?.map((nft) => {
						return <AssetStoreHolder nft={nft} key={nft.id} />;
					})}
				</div>	
			)}

		     
        </>
    );
}

export default StoreNotSelling;