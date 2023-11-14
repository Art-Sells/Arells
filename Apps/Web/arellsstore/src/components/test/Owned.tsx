'use client'

import React, { useMemo } from "react";
import { useRouter } from 'next/router';

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
	const [create, setCreate] = useState(true);
	const [createConnected, setCreateConnected] = useState(false);
    const [noArtCreated, setNoArtCreated] = useState(false);
    const [artCreated, setArtCreated] = useState(false);
// useState constants above

// asset functions below
	const { address, connectWallet } = useSigner();
    const storeAddressFromURL = useMemo(() => {
        const address = Array.isArray(router.query.storeAddress)
            ? router.query.storeAddress[0]
            : router.query.storeAddress;
        return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);

    const { createdNFTs } = useNFTMarket(storeAddressFromURL); // passing storeAddress to the hook
	useEffect(() => {
		if(createdNFTs) {
			setLoading(false);
		}
    }, [createdNFTs]);
    useEffect(() => {
        if (!address) {
			setCreate(true);
			setCreateConnected(false);
        } else {
            setCreate(false);
            setCreateConnected(true);
        }
    }, [address]);
	useEffect(() => {
		if (createdNFTs && createdNFTs.length > 0) {
			const isOwnerOfAnyNFT = createdNFTs.some(nft => {
				return nft.storeAddress === storeAddressFromURL;
			});
	
			if (isOwnerOfAnyNFT) {
				setNoArtCreated(false);
				setArtCreated(true);
			} else if (!isOwnerOfAnyNFT){
				setNoArtCreated(true);
				setArtCreated(false);
			}
		}
	}, [createdNFTs, storeAddressFromURL]);
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
				{create && (
					<button id="cart-link-seller-created" onClick={connectWallet}>
						<Image
						loader={imageLoader}
						onLoad={() => handleImageLoaded('arellsIcon')}
						alt=""
						height={18}
						width={18} 
						id="cart-icon-seller-created" 
						src="images/prototype/Add-Ivory.png"/>
					</button>
				)}	
				{createConnected && (
					// change below link after test
					<Link legacyBehavior href="/test/create">
						<a id="cart-link-connected-seller-created">
							<Image
							loader={imageLoader}
							alt=""
							height={18}
							width={18}
							id="cart-icon-seller-created" 
							src="images/prototype/Add-Ivory.png"/>
						</a>
					</Link>	
				)}		
			</div>
			<Image
			loader={imageLoader}
			onLoad={() => handleImageLoaded('arellsLogo')}
			alt=""
			width={110}  
			height={35} 
			id="word-logo-seller-created" 
			src="images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-created">NEVER LOSE MONEY SELLING ART</p>
			<hr id="profileline-seller-created"/>
			<div id="created-collected-seller-created">
			{/*<!-- Change below link after test -->*/}	
				<Link legacyBehavior href="/test/selling">
					<a id="selling">Selling</a>	
				</Link>	
				<a id="owned" >Owned</a>		
			</div>
			{noArtCreated && (
				<p id="no-art">
				</p>
			)}
			{artCreated && (
				<div id="container-seller-created">
					{createdNFTs?.map((nft) => {
						return <AssetStoreHolder nft={nft} key={nft.id} />;
					})}
				</div>	
			)}

		     
        </>
    );
}

export default Owned;