"use client";

import { useRouter } from 'next/router';

// asset components (change below links after test)
import useSigner from "../../../state/signer";
import useNFTMarket from "../../../state/nft-market";
import AssetHolder from "./AssetHolder";

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';


const Asset = () => {
	// asset functions below
	const { address} = useSigner();
	const router = useRouter();
	const storeAddressFromURL = Array.isArray(
		router.query.storeAddress) ? router.query.storeAddress[0]
		: router.query.storeAddress || null;

	const { createdNFTs } = useNFTMarket(storeAddressFromURL); 

	return (
		<>	
			{!address && (
				<p id="no-art">
				</p>
			)}
			{address && (
				<>
					{createdNFTs?.map((nft) => {
						return <AssetHolder nft={nft} key={nft.id} ownerId={''} />;
					})}
				</>	
			)}
			
		</>
	);
}

export default Asset;