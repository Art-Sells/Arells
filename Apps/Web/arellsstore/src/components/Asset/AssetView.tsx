"use client";

import { useRouter } from 'next/router';
import useSigner from "../../state/signer";
import { useSingleNFT } from "../../state/nft-market/useCreatedNFTs"; 
import { useSingleSellingNFT } from "../../state/nft-market/useSellingNFTs"; 
import AssetViewHolder from "./AssetViewHolder";
import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import '../../app/css/prototype/asset/asset.css';
import '../../app/css/prototype/seller-created.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

const AssetView = () => {
    const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `${src}?w=${width}&q=${quality || 100}`;
      };

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

    useEffect(() => {
        if (nft || nftSelling) {
            setLoading(false);
        }
    }, [nft, nftSelling]);

    return (
        <>
        {/* {showLoading && (
            <div id="spinnerBackground">
            <Image 
                loader={imageLoader}
                alt="" 
                width={29}
                height={30}
                id="arells-loader-icon-asset" 
                src="/images/Arells-Icon.png"/>   
                <div className={styles.spinner}></div>    
            </div>
        )} */}
            {nft && 
            <AssetViewHolder nft={nft} key={nft.id} ownerId={storeAddressFromURL} />
            }
            {nftSelling && 
            <AssetViewHolder nft={nftSelling} key={nftSelling.id} ownerId={storeAddressFromURL} />
            }
        </>
    );
};

export default AssetView;
