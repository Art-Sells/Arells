'use client'

// asset components (change below links after test)
import useSigner from "../../../state/signer";
import { ipfsToHTTPS } from "../../../helpers";
import { NFT } from "../../../state/nft-market/interfaces"

// Change below link after test
import '../../../app/css/prototype/seller-created.css';
import '../../../app/css/prototype/buyer-collected.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type AssetStoreMetadata = {
    name: string;
    imageURL: string;
};

type AssetStoreProps = {
    nft: NFT;
};

const StoreAssetHolder = (props: AssetStoreProps) => {
//loader functions below 
    // const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
      return `${src}?w=${width}&q=${quality || 100}`;
    };
    // const [imagesLoaded, setImagesLoaded] = useState({
    //     nftImageSellerCreated: false,
    // });
    // const handleImageLoaded = (imageName: string) => {
    //     setImagesLoaded(prevState => ({
    //         ...prevState,
    //         [imageName]: true 
    //     }));
    // };
    // useEffect(() => {
    //     if (Object.values(imagesLoaded).every(Boolean)) {
    //         setLoading(false);
    //     }
    // }, [imagesLoaded]);
// loader functions above

// asset constants below
    const { address, connectWallet} = useSigner();
    const { nft } = props;
    const storeAddress = nft.storeAddress;
    const addressMatch = address == storeAddress;

    const [meta, setMeta] = useState<AssetStoreMetadata>();

// asset constants above

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
  
// Asset Changing function/s above 

  return (
    <>
        {/*<!-- Modals below link after test -->*/}
        {/* {showLoading && (
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
        )}   */}

        {/*<!-- Modals Above -->*/}

        <div id="blue-orange-seller-created">
          {/*  Change below link after test  */}
          {meta && (
            <Link legacyBehavior href='/'>
              <a target="_self" id="photo-link-seller-created">
                <Image
                  loader={imageLoader}
                  alt=""
                  width={200}  
                  height={200}  
                  id="photo-seller-created" 
                  src={meta?.imageURL}
                />
              </a>
            </Link>
          )}
            {!addressMatch && address && (
                <>
                    <div id="blue-orange-prices-before-seller-created">
                      <Image
                        loader={imageLoader}
                        alt=""
                        width={40}  
                        height={8}  
                        id="PAP-logo" 
                        src="/images/PriceAfterPurchaseLogo.png"
                      />
                      <p id="PAP-seller-created">Price After Purchase</p>
                      <p id="PAP-blue-orange-before-seller-created">...</p>
                      <hr id="priceline-seller-created" />
                      <p id="yourprice-seller-created">Price</p>
                      <p id="price-blue-orange-before-seller-created">...</p>
                    </div>
                </>
            )}	
            {!addressMatch && !address && (
                <>
                    <div id="blue-orange-prices-before-seller-created">
                      <Image
                        loader={imageLoader}
                        alt=""
                        width={40}  
                        height={8}  
                        id="PAP-logo" 
                        src="/images/PriceAfterPurchaseLogo.png"
                      />
                      <p id="PAP-seller-created">Price After Purchase</p>
                      <p id="PAP-blue-orange-before-seller-created">{nft.price}</p>
                      <hr id="priceline-seller-created" />
                      <p id="yourprice-seller-created">Price</p>
                      <p id="price-blue-orange-before-seller-created">{nft.price}</p>
                    </div>
                    <button id="blue-orange-add-to-cart-seller-created" 
                    onClick={connectWallet}>
                    SELL</button>
                </>
            )}	
            {addressMatch && address && (
                <>
                    <div id="blue-orange-prices-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={40}  
                          height={8}  
                          id="PAP-logo" 
                          src="/images/PriceAfterPurchaseLogo.png"
                        />
                        <p id="PAP-seller-created">Price After Purchase</p>
                        <p id="PAP-blue-orange-before-seller-created">${nft.price}</p>
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">${nft.price}</p>
                    </div>
                    <button id="blue-orange-add-to-cart-seller-created" 
                    //onClick={setPrices}
                    >
                    SELL</button>
                </>
            )}	
            
        </div>    
    </>
  );
};

export default StoreAssetHolder;