"use client";

import { useRouter } from 'next/router';
import useSigner from "../../../state/signer";
import { useSingleNFT } from "../../../state/nft-market/useCreatedNFTs"; 
import { useSingleSellingNFT } from "../../../state/nft-market/useSellingNFTs"; 
import AssetHolder from "./AssetHolder";
import '../../../app/css/prototype/asset/asset.css';
import { useMemo } from 'react';

const Asset = () => {
    const { address } = useSigner();
    const router = useRouter();
    const storeAddressFromURL = useMemo(() => {
        const address = Array.isArray(router.query.storeAddress)
            ? router.query.storeAddress[0]
            : router.query.storeAddress;
        return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);
    const nftId = router.query.nftId;

    const { nft } = useSingleNFT(storeAddressFromURL, nftId); 
    const { nftSelling } = useSingleSellingNFT(storeAddressFromURL, nftId); 



    return (
        <>
            {!address && <p id="no-art"></p>}
            {nft && 
            <AssetHolder nft={nft} key={nft.id} ownerId={storeAddressFromURL} />
            }
            {nftSelling && 
            <AssetHolder nft={nftSelling} key={nftSelling.id} ownerId={storeAddressFromURL} />
            }
        </>
    );
};

export default Asset;
