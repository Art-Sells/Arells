"use client";

import { useRouter } from 'next/router';
import useSigner from "../../../state/signer";
import { useSingleNFT } from "../../../state/nft-market/useCreatedNFTs"; 
import AssetHolder from "./AssetHolder";
import '../../../app/css/prototype/asset/asset.css';

const Asset = () => {
    const { address } = useSigner();
    const router = useRouter();
    const storeAddressFromURL = Array.isArray(router.query.storeAddress)
        ? router.query.storeAddress[0]
        : router.query.storeAddress || null;
    const nftId = router.query.nftId;

    const { nft } = useSingleNFT(storeAddressFromURL, nftId); 

    return (
        <>
            {!address && <p id="no-art"></p>}
            {address && nft && nft.storeAddress === storeAddressFromURL && (
                <AssetHolder nft={nft} ownerId={storeAddressFromURL} />
            )}
        </>
    );
};

export default Asset;
