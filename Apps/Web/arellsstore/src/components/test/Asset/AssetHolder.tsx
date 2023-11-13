'use client'

// asset components (change below links after test)
import useSigner from "../../../state/signer";
import { ipfsToHTTPS } from "../../../helpers";
import { NFT } from "../../../state/nft-market/interfaces"

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from "next/router";

type AssetMetadata = {
    name: string;
    imageURL: string;
};

type AssetProps = {
    nft: NFT;
    ownerId: string;
};

const AssetHolder = (props: AssetProps) => {
//loader functions below 
    const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
      return `${src}?w=${width}&q=${quality || 100}`;
    };
    const [imagesLoaded, setImagesLoaded] = useState({
        nftImage: false,
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

// asset constants below
    const { address, connectWallet} = useSigner();
    const { nft } = props;
    const router = useRouter();
    const storeAddressFromURL = Array.isArray(router.query.storeAddress) 
    ? router.query.storeAddress[0]
    : router.query.storeAddress;
    const addressMatch = address?.toLowerCase() === storeAddressFromURL?.toLowerCase();

    const [meta, setMeta] = useState<AssetMetadata>();
// asset constants above

{/*<!-- useState constants below -->*/}

{/*<!-- useState constants above -->*/}

// Asset Changing function/s below 
    useEffect(() => {
      const fetchMetadata = async () => {
        const metadataResponse = await fetch(ipfsToHTTPS(nft.tokenURI));
        console.log("Metadata Response: ", metadataResponse);
        if (metadataResponse.status != 200) return;
        const json = await metadataResponse.json();
        setMeta({
          name: json.name,
          imageURL: ipfsToHTTPS(json.image),
        });
      };
      void fetchMetadata();
    }, [nft.tokenURI]);

	function listToSell() {

	}
// Asset Changing function/s above 



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
        <p id="slogan-blue-orange">SET PRICES TO SELL</p>

        <div id="blue-orange">
            {meta && (
                <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('nftImage')}
                alt=""
                width={400}  
                height={400}
                id="photo-blue-orange"
                src={meta?.imageURL}/>
            )}
            <h3 id="name-blue-orange">{meta?.name}</h3> 
            <div id="blue-orange-prices-before-seller-created">
                <p id="PAP-seller-created">Price After Purchase</p>
                <p id="PAP-blue-orange-before-seller-created">{nft.price}</p>
                <hr id="priceline-seller-created" />
                <p id="yourprice-seller-created">Price</p>
                <p id="price-blue-orange-before-seller-created">{nft.price}</p>
            </div>
            <button id="blue-orange-add-to-cart-connected-blue-orange" 
            // change below function after test
            onClick={listToSell}
            >
            LIST TO SELL</button>    
    		
                                        
        </div>		   
    </>
  );
};

export default AssetHolder;