'use client'

// asset components (change below links after test)
import useSigner from "../../../state/signer";
import { ipfsToHTTPS } from "../../../helpers";
import { NFT } from "../../../state/nft-market/interfaces"

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';
import '../../../app/css/modals/copiedlink.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    // const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
      return `${src}?w=${width}&q=${quality || 100}`;
    };
    // const [imagesLoaded, setImagesLoaded] = useState({
    //     nftImage: false,
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
    const [meta, setMeta] = useState<AssetMetadata>();

    const forSale = nft.price != "0";
    const owned = nft.owner == address?.toLowerCase();
// asset constants above

{/*<!-- useState constants below -->*/}
    const [showCopiedLink, setCopiedLink] = useState(false);
        
    const [ownedByCreatorAsset, setOwnedByCreatorAsset] = useState(true);
    const [ownedByBuyerAsset, setOwnedByBuyerAsset] = useState(false);
	
    const [artAddedToCart, setArtAddedToCart] = useState(false);
    const [artAddToCart, setArtAddToCart] = useState(true);
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

	function addArtToCart() {
        setArtAddedToCart(true);
		setArtAddToCart(false);
	}
// Asset Changing function/s above 

// Copy Links function/s below
    const [fullUrl, setFullUrl] = useState<string>('');
    useEffect(() => {
        setFullUrl(window.location.href);
    }, []);
    const copyLink = () => {
        navigator.clipboard.writeText(fullUrl).then(() => {
            setCopiedLink(true);
        });
    };

    const closeCopiedLink = () => {
    setCopiedLink(false);
    };
// Copy Links function/s above

  return (
    <>
{/*<!-- Modals below link after test -->*/}
        {showCopiedLink && (
			<div id="copiedLink">
				<div className="modal-content">
				<p>LINK COPIED</p>
				<button className="close"
					onClick={closeCopiedLink}>OK</button>	
				</div>
			</div>	
		)}

        {/* 
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
        )}   */}

{/*<!-- Modals Above -->*/}

        <div id="blue-orange">
            {meta && (
                <Image
                loader={imageLoader}
                alt=""
                width={400}  
                height={400}
                id="photo-blue-orange"
                src={meta?.imageURL}/>
            )}
            <h3 id="name-blue-orange">{meta?.name}</h3> 
            <div id="share-div-blue-orange">
                <p id="share-div-desc-blue-orange">SHARE</p>
                <button id="copy-link-blue-orange"
                onClick={copyLink}>
                    <Image
                    loader={imageLoader}
                    alt=""
                    width={15}  
                    height={8}
                    id="copy-link-icon-blue-orange"
                     src="images/prototype/link.png"/>
                    COPY LINK
                </button>	
            </div>
            <div id="created-by-blue-orange">
                <p id="creator-owner-desc-blue-orange">Created By</p>
                <Link legacyBehavior href="/prototype/seller-created">
                    <a id="creator-owner-link-blue-orange">
                        Abstract Kadabra
                    </a>
                </Link>
            </div>
            {!owned && (
                <div id="owned-by-creator-blue-orange">
                    <p id="creator-owner-desc-blue-orange">Owned By</p> 
                    <p id="creator-owner-link-blue-orange">-</p>
                </div>
            )}
            {owned && (
                <div id="owned-by-buyer-blue-orange">
                    <p id="creator-owner-desc-blue-orange">Owned By</p> 
                    <Link legacyBehavior href="/prototype/buyer-collected">
                        <a id="creator-owner-link-blue-orange" >
                            {owned}
                        </a>
                    </Link>
                </div>
            )}
            <hr id="line-blue-orange"/>
            {!forSale && (
                <>
                    <div id="blue-orange-prices-before-blue-orange">
                        <p id="PAP-blue-orange">Price After Purchase</p>
                        <p id="PAP-blue-orange-before-blue-orange">...</p>
                        <hr id="priceline-blue-orange"/>
                        <p id="yourprice-blue-orange">Price</p>
                        <p id="price-blue-orange-before-blue-orange">...</p>
                    </div>	
                    <button id="not-for-sale-asset">
                        NOT FOR SALE
                    </button>
                </>
            )}	
            {forSale && !address && (
                <>
                    <div id="blue-orange-prices-after-blue-orange">
                        <p id="PAP-blue-orange">Price After Purchase</p>
                        <p id="PAP-blue-orange-after-blue-orange">${nft.price}</p>
                        <hr id="priceline-blue-orange"/>
                        <p id="yourprice-blue-orange">Price</p>
                        <p id="price-blue-orange-after-blue-orange">${nft.price}</p>
                    </div>	
                    <button id="for-sale-asset">
                        FOR SALE
                    </button>
                    <button id="blue-orange-add-to-cart-blue-orange" onClick={connectWallet}>
                    ADD TO CART</button>
                </>
            )}	
            {forSale && address && (
                <>
                    <div id="blue-orange-prices-before-seller-created">
                        <p id="PAP-seller-created">Price After Purchase</p>
                        <p id="PAP-blue-orange-before-seller-created">{nft.price}</p>
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">{nft.price}</p>
                    </div>
                    <button id="for-sale-seller-created">
                        FOR SALE
                    </button>
                    {artAddToCart && (
                        <button id="blue-orange-add-to-cart-connected-blue-orange" 
                        // change below function after test
                        onClick={addArtToCart}
                        >
                        ADD TO CART</button>
                    )}
                    {artAddedToCart && (
                        <button id="blue-orange-added-blue-orange">
                        ADDED</button>
                    )}
                </>
            )}	      
            <div id="fingerprints">
                <p id="digital-fingerprints">DIGITAL FINGERPRINTS</p>
                <span>
                    <button id="fingerprints-button"
                        //onClick={comingSoon}
                        >
                        <Image
                        loader={imageLoader}
                        alt=""
                        width={25}  
                        height={25}
                         id="fingerprints-icon"
                          src="images/prototype/etherscan-logo.png"/>
                    </button>	
                </span>
                <span>
                    <button id="fingerprints-button"
                        //onClick={comingSoon}
                        >
                        <Image
                        loader={imageLoader}
                        alt=""
                        width={24}  
                        height={25}
                         id="fingerprints-icon"
                          src="images/prototype/ipfs.png"/>
                    </button>	
                </span>
                <span>
                    <button id="fingerprints-button"
                        // onClick={comingSoon}
                        >
                        <Image
                        loader={imageLoader}
                        alt=""
                        width={25}  
                        height={23}
                         id="fingerprints-icon"
                          src="images/prototype/ipfslite.png"/>
                    </button>	
                </span>
            </div>	    		
                                        
        </div>		   
    </>
  );
};

export default AssetHolder;