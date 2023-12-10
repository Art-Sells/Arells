'use client'

import React, { useMemo } from "react";
import { useRouter } from 'next/router';

// asset components (change below links after test)
import useSigner from "../state/signer";
import useNFTMarket from "../state/nft-market";
import StoreAssetHolder from "./Asset/StoreAssetHolder";

// Change below link after test
import '../app/css/prototype/seller-created.css';
import '../app/css/prototype/buyer-collected.css';

//Loader Styles
import '../app/css/modals/loading/spinnerBackground.css';
import styles from '../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Owned = () => {
	

//loader functions below 
    const router = useRouter();
    const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };
	const [imagesLoaded, setImagesLoaded] = useState({
		arellsLogo: false,
		arellsIcon: false,
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
    const [noArtCreated, setNoArtCreated] = useState(false);
    const [artCreated, setArtCreated] = useState(false);
	const [artSelling, setArtSelling] = useState(false);
// useState constants above

// asset functions below
	const { address, connectWallet } = useSigner();
    const storeAddressFromURL = useMemo(() => {
        const address = Array.isArray(router.query.storeAddress)
            ? router.query.storeAddress[0]
            : router.query.storeAddress;
        return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);

    const { 
		createdNFTs,
		sellingNFTs 
	} = useNFTMarket(storeAddressFromURL);

	const hasCreatedArt = !!createdNFTs && createdNFTs.length > 0;
	const hasSellingArt = !!sellingNFTs && sellingNFTs.length > 0;

	useEffect(() => {
		if(createdNFTs || sellingNFTs) {
			setLoading(false);
		}
    }, [createdNFTs, sellingNFTs]);
	useEffect(() => {
		
		setArtCreated(hasCreatedArt);
		setArtSelling(hasSellingArt);

	}, [createdNFTs, sellingNFTs]);

	const nftCount = createdNFTs?.length || 0;
	const nftCountSelling = sellingNFTs?.length || 0;

    const containerClass = nftCount > 2 ? "three-items" : "two-items";
	const containerClassTwo = nftCountSelling > 2 ? "three-items" : "two-items";


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
		{!showLoading && (
			<>
				<div id="header-seller-created">
					
		{/*<!-- Change below link after test -->*/}
						<Link href="/" id="icon-link-seller-created">
								<Image
								loader={imageLoader}
								alt=""
								height={16}
								width={15}
								id="arells-icon-seller-created" 
								src="images/prototype/Arells-Icon-Home.png"/>
						</Link>							
						<Link href="/create" id="cart-link-connected-seller-created">
								<Image
								loader={imageLoader}
								alt=""
								height={18}
								width={18}
								id="cart-icon-seller-created" 
								src="images/prototype/Add-Ivory.png"/>
						</Link>	
				</div>
			</>
		)}
		<Image
		loader={imageLoader}
		onLoad={() => handleImageLoaded('arellsLogo')}
		alt=""
		width={110}  
		height={35} 
		id="word-logo-seller-created" 
		src="images/Arells-Logo-Ebony.png"/>
		<p id="slogan-seller-created">BUY ART THAT NEVER LOSES VALUE</p>
		<hr id="profileline-seller-created"/>
		<div id="created-collected-seller-created">
{/*<!-- Change below link after test -->*/}	
			<Link legacyBehavior href={`/buy/${storeAddressFromURL}`} passHref>
				<a id="selling">Buy</a>	
			</Link>
			<a id="owned" >Own</a>
		</div>
			{noArtCreated && (
				<p id="no-art">
				</p>
			)}
			{artCreated && (
				<>
					<div id="container-seller-created" className={containerClass}>
						{createdNFTs?.map((nft) => {
							return <StoreAssetHolder nft={nft} key={nft.id} />;
						})}
					</div>
					<hr id="inventory-line"/>				
				</>
			)}
			{artSelling && (
				<>
					<hr id="selling-line"/>
					<div id="container-seller-created" className={containerClassTwo}>
						{sellingNFTs?.map((nft) => (
							<StoreAssetHolder nft={nft} key={nft.id} />
						))}
					</div>
				</>
			)}

		     
        </>
    );
}

export default Owned;