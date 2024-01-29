'use client'

import React, { useMemo } from "react";
import { useRouter } from 'next/router';
import { signIn ,useSession } from "next-auth/react";

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

const OwnedModule = () => {

// Sign in/out
	const { data: session, status } = useSession();
// Sign in/out
	

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
// useState constants above

// asset functions below
	const { address, connectWallet } = useSigner();
    const storeAddressFromURL = useMemo(() => {
        const address = Array.isArray(router.query.storeAddress)
            ? router.query.storeAddress[0]
            : router.query.storeAddress;
        return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);
	const addressMatch = address?.toLowerCase() === storeAddressFromURL?.toLowerCase();

    const { 
		createdNFTs,
		sellingNFTs 
	} = useNFTMarket(storeAddressFromURL);

	const memoizedCreatedNFTs = useMemo(() => createdNFTs || [], [createdNFTs]);
	const memoizedSellingNFTs = useMemo(() => sellingNFTs || [], [sellingNFTs]);

	const artCreated = memoizedCreatedNFTs.length > 0;
	const artSelling = memoizedSellingNFTs.length > 0;

	useEffect(() => {
		if(createdNFTs || sellingNFTs) {
			setLoading(false);
		}
    }, [createdNFTs, sellingNFTs]);

	const nftCount = createdNFTs?.length || 0;
	const nftCountSelling = sellingNFTs?.length || 0;

    const containerClass = nftCount > 2 ? "three-items" : "two-items";
	const containerClassTwo = nftCountSelling > 2 ? "three-items" : "two-items";

	const owner = addressMatch; 
	const ownerSignedIn = addressMatch && session;
	const notOwner = !addressMatch && !address;
	const notOwnerConnected = !addressMatch && address;
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
				<div className={styles.spinner}></div>     
			</div>
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
					{notOwnerConnected && (
						<Link 
							legacyBehavior 
							href={`/own/${address}`} passHref
							id="icon-link-seller-created">
							<Image
								loader={imageLoader}
								alt=""
								height={18}
								width={18}
								id="cart-icon-seller-created" 
								src="images/market/store.png"/>
						</Link>	
					)}	
					{notOwner && (
						<button 
							onClick={connectWallet}
							id="cart-link-connected-seller-created">
							<Image
								loader={imageLoader}
								alt=""
								height={18}
								width={18}
								id="cart-icon-seller-created" 
								src="images/market/wallet.png"/>
						</button>	
					)}	
					{owner && (
						<Link 
							href="/create" 
							id="cart-link-connected-seller-created">
							<Image
								loader={imageLoader}
								alt=""
								height={18}
								width={18}
								id="cart-icon-seller-created" 
								src="images/prototype/Add-Ivory.png"/>
						</Link>	
					)}					
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
		<hr id="black-liner-bottom-owned-buy"/>
		<p id="ada-description-owned-buy">ARELLS DIGITAL ASSETS</p>
		{/* <hr id="profileline-seller-created"/> */}
		{ownerSignedIn && (
			<Link legacyBehavior href={`/buy/${storeAddressFromURL}`} passHref>
				<button id="blue-orange-add-to-cart-seller-created-selling">
					EDIT</button>	
			</Link>
		)}
		{owner && (
			<button 
			id="blue-orange-add-to-cart-seller-created-selling" 
			onClick={() => signIn('google')}>
				SIGN IN TO EDIT</button>
		)}

		<div id="profile-img-container-buyer-collected">
			<Image
				loader={imageLoader}
				alt=""
				width={100}  
				height={100}
				id="profile-photo-buyer-collected" 
				src="images/market/Market-Default-Icon.jpg"/>
		</div>	
		{owner && (
			<h1 id="name-buyer-collected">My Store</h1>
		)}  
		{!owner && (
			<h1 id="name-buyer-collected">New Store</h1>
		)} 
		<p id="description-seller-created">
			<span>
				<Image
					loader={imageLoader}
					alt=""
					width={20}  
					height={40}
					id="location" 
					src="images/market/location.png"/>
			</span>
			<span>
				Store Address|Location
			</span>
		</p> 
		<p id="description-seller-created">
			{storeAddressFromURL}
		</p> 
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
						{memoizedCreatedNFTs.map((nft) => {
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
						{memoizedSellingNFTs.map((nft) => (
							<StoreAssetHolder nft={nft} key={nft.id} />
						))}
					</div>
					<hr id="inventory-line"/>
				</>
			)}

		<p id="bear-markets-description-owned-buy">
				NO MORE BEAR MARKETS
		</p>     
        </>
    );
}

export default OwnedModule;