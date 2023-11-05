"use client";

// asset components (change below links after test)
import useSigner from "../../../state/signer";
import useNFTMarket from "../../../state/nft-market";
import AssetHolder from "./AssetHolder";

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState, FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';


// const AssetTest = () => {
// 	return (
// 		<>
// 		<p>
// 			Testing
// 		</p>
// 		</>
// 	);
// }

// export default AssetTest;

type AssetTestProps = {
	ownerId?: string | string[];
	nftId?: string | string[];
};

const AssetTest: FC<AssetTestProps> = ({ ownerId, nftId }) => {
	
//loader functions below 
	const [showLoading, setLoading] = useState(true);
	const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
		return `/${src}?w=${width}&q=${quality || 100}`;
	};
	const [imagesLoaded, setImagesLoaded] = useState({
		arellsIconAsset: false,
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

{/*<!-- useState constants below -->*/}
	const [noArtAsset, setNoArtAsset] = useState(false);
	const [artAsset, setArtAsset] = useState(false);

	const [cartLinkAsset, setCartLinkAsset] = useState(true);
	const [cartLinkConnectedAsset, setCartLinkConnectedAsset] = useState(false);
	const [cartLinkFullAsset, setCartLinkFullAsset] = useState(false);
{/*<!-- useState constants above -->*/}

// asset functions below
	const { address, connectWallet} = useSigner();
	const {createdNFTs} = useNFTMarket();
	const specificNFT = createdNFTs?.find((nft) => String(nft.id) === String(nftId));
		// Add these console.log statements to check the values
		//console.log('Available NFT IDs:', createdNFTs?.map(nft => nft.id));

	useEffect(() => {
		if (createdNFTs) {
			setArtAsset(true);
			setLoading(false);
		}
	}, [createdNFTs]);
	const { getCreatorOrCollector } = useNFTMarket();
	const [creatorOrCollectorAddress, setCreatorOrCollectorAddress] = useState<string | undefined>();
  
	useEffect(() => {
		const fetchCreatorOrCollector = async () => {
		  if (nftId) {
			try {
			  const result = await getCreatorOrCollector(nftId as string);
			  if (result) {
				setCreatorOrCollectorAddress(result.address);
			  }
			} catch (error) {
			  console.error("Failed to fetch the creator or collector address:", error);
			}
		  }
		};
	
		fetchCreatorOrCollector();
	}, [nftId, getCreatorOrCollector]);
// asset constants above

// Cart Changing function/s below 
	useEffect(() => {
		if (address) {
			setCartLinkAsset(false);
			setCartLinkConnectedAsset(true);
		}
		else if (!address){
			setCartLinkAsset(true);
			setCartLinkConnectedAsset(false);	
		}
	}, [address]);
// Cart Changing function/s above 
	
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

			<div id="header-blue-orange">
			
				{/*<!-- Change below link after test -->*/}
					<Link legacyBehavior href="/">
						<a id="icon-link-blue-orange">
							<Image
							loader={imageLoader}
							onLoad={() => handleImageLoaded('arellsIconAsset')}
							alt=""
							height={16}
							width={15}
							 id="arells-icon-blue-orange" 
							 src="images/prototype/Arells-Icon-Home.png"/>
						</a>
					</Link>	
					{cartLinkAsset && (
						<button id="cart-link-blue-orange" onClick={connectWallet}>
							<Image
							loader={imageLoader}
							alt=""
							height={15}
							width={16}
							id="cart-icon-blue-orange"
							 src="images/prototype/shopping-cart-empty.png"/>
						</button>
					)}	
					{cartLinkConnectedAsset && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-connected-blue-orange">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16}
								id="cart-icon-blue-orange" 
								src="images/prototype/shopping-cart-empty.png"/>
							</a>	
						</Link>
					)}	

					{cartLinkFullAsset && (
						<Link legacyBehavior href="/prototype/cart">
							<a id="cart-link-full-blue-orange">
								<Image
								loader={imageLoader}
								alt=""
								height={15}
								width={16}
								 id="cart-icon-full-blue-orange"
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
				id="word-logo-blue-orange" 
				src="images/Arells-Logo-Ebony.png"/>	
				<p id="slogan-blue-orange">NEVER LOSE MONEY SELLING ART</p>
			
			{noArtAsset && (
				<p>Art Doesn't Exist
				</p>
			)}
			{specificNFT && creatorOrCollectorAddress &&
				<AssetHolder 
				nft={specificNFT}
				ownerId={creatorOrCollectorAddress}
				key={specificNFT.id}
				/>
			}
        </>
    );
}

export default AssetTest;