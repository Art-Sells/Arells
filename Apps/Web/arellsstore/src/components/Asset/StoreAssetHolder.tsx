'use client'

// asset components (change below links after test)
import useSigner from "../../state/signer";
import { ipfsToHTTPS } from "../../helpers";
import { NFT } from "../../state/nft-market/interfaces"

// Change below link after test
import '../../app/css/prototype/seller-created.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/photoloader.module.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from "next/router";
import { ethers } from "ethers";
import useNFTMarket from "../../state/nft-market";
import { toast } from "react-toastify";
import { usePriceAfterPurchaseSets } from "../../state/nft-market/usePriceAfterPurchaseSets";
import React from "react";

type AssetStoreMetadata = {
    name: string;
    imageURL: string;
};

type AssetStoreProps = {
    nft: NFT;
};

const StoreAssetHolder = React.memo((props: AssetStoreProps) => {
//loader functions below 
    const [isImageLoaded, setIsImageLoaded] = useState(false);
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
    const formattedPrice = nft.price.includes('.') 
    ? nft.price 
    : ethers.utils.formatUnits(ethers.BigNumber.from(nft.price), 'ether');
    const priceAsBigNumber = ethers.utils.parseUnits(formattedPrice, 'ether');
    const doublePrice = priceAsBigNumber.mul(2);
    const formattedPriceAfterPurchase = ethers.utils.formatUnits(doublePrice, 'ether');

    const router = useRouter();
    const storeAddressFromURL = useMemo(() => {
      const address = Array.isArray(router.query.storeAddress)
          ? router.query.storeAddress[0]
          : router.query.storeAddress;
      return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);
    const addressMatch = address?.toLowerCase() === storeAddressFromURL?.toLowerCase();


    const [meta, setMeta] = useState<AssetStoreMetadata>();

// asset constants above

// Asset Changing function/s below 
    // Function to extract the token ID from the URI
    function extractTokenId(tokenURI: string) {
      const parts = tokenURI.split('/');
      return parts[parts.length - 1];
    }
  
    // Function to check if an image exists at a given URL
    const checkImageExists = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.status === 200;
      } catch {
        return false;
      }
    };
  
    // Function to update the metadata
    const updateMetadata = async () => {
      if (nft.tokenURI) {
        const tokenId = extractTokenId(nft.tokenURI);
        const expectedS3ImageUrl = `https://arellsnftcdn.s3.us-west-1.amazonaws.com/image-${tokenId}.jpg`;
    
        // Fetch metadata from tokenURI to get the name and image URL
        let nameFromMetadata;
        let imageURLFromMetadata;
        const metadataResponse = await fetch(nft.tokenURI);
        if (metadataResponse.status === 200) {
          const json = await metadataResponse.json();
          nameFromMetadata = json.name;
          imageURLFromMetadata = json.image;
        }
    
        const s3ImageExists = await checkImageExists(expectedS3ImageUrl);
        if (s3ImageExists) {
          setMeta({
            name: nameFromMetadata, // Use the name from the JSON metadata
            imageURL: expectedS3ImageUrl,
          });
        } else {
          // If the S3 image does not exist, use the image URL from the tokenURI JSON
          setMeta({
            name: nameFromMetadata,
            imageURL: imageURLFromMetadata,
          });
        }
      }
    };
  
    // useEffect hook
    useEffect(() => {
      updateMetadata();
    }, [nft.tokenURI]);
  
  
  


    const [isNFTMinted, setIsNFTMinted] = useState(false);
    const { checkIfNFTMinted } = useNFTMarket(storeAddressFromURL);

    useEffect(() => {
    const checkMintingStatus = async () => {
        const minted = await checkIfNFTMinted(nft.id);
        setIsNFTMinted(minted);
    };

      checkMintingStatus();
    }, [nft.id, checkIfNFTMinted]);

    const { priceAfterPurchaseSets = [] } = usePriceAfterPurchaseSets(nft.id);
    const [formattedNewPriceAfterPurchase, setFormattedNewPriceAfterPurchase] = useState("...");
    const forSale = nft.price != "0";
    const [isLoadingNewPrice, setIsLoadingNewPrice] = useState(true);
    useEffect(() => {
        if (priceAfterPurchaseSets?.length > 0) {
            const newPAP = priceAfterPurchaseSets[0].newPriceAfterPurchase;
            setFormattedNewPriceAfterPurchase(newPAP !== "0" ? newPAP : "...");
            setIsLoadingNewPrice(false); // Data is now ready, set loading to false
        }
    }, [priceAfterPurchaseSets]);
    const forSaleMinted = formattedNewPriceAfterPurchase != "...";


    const notConnectedNotListed = 
    !addressMatch && !address && !forSale; 
    const notConnectedListed = 
    !addressMatch && !address && forSale; 

    const connectedBuyerNotListedNotMintedNotRelisted = 
    !addressMatch && address && !forSale && !isNFTMinted && !forSaleMinted; 
    const connectedBuyerListedNotMintedNotRelisted = 
    !addressMatch && address && forSale && !isNFTMinted && !forSaleMinted; 
    const connectedBuyerListedMintedNotRelisted = 
    !addressMatch && address && forSale && isNFTMinted && !forSaleMinted; 
    const connectedBuyerListedMintedRelisted = 
    !addressMatch && address && forSale && isNFTMinted && forSaleMinted; 

    const connectedOwnerNotListedNotMintedNotRelisted = 
    addressMatch && address && !forSale && !isNFTMinted && !forSaleMinted; 
    const connectedOwnerListedNotMintedNotRelisted = 
    addressMatch && address && forSale && !isNFTMinted && !forSaleMinted; 
    const connectedOwnerListedMintedNotRelisted = 
    addressMatch && address && forSale && isNFTMinted && !forSaleMinted; 
    const connectedOwnerListedMintedRelisted = 
    addressMatch && address && forSale && isNFTMinted && forSaleMinted; 
// Asset Changing function/s above 


//Formatted Price 
    const formatPriceWithCommasAndDecimals = (price: string) => {
      return parseFloat(price).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
      });
    };

    const formattedPriceWithCommasAndDecimals = formatPriceWithCommasAndDecimals(formattedPrice);
    const formattedPriceAfterPurchaseWithCommasAndDecimals = formatPriceWithCommasAndDecimals(formattedPriceAfterPurchase);
    const formattedNewPriceAfterPurchaseWithCommasAndDecimals = formattedNewPriceAfterPurchase === "..." 
      ? "..." 
      : formatPriceWithCommasAndDecimals(formattedNewPriceAfterPurchase);

      const calculateFiftySevenPercent = (price: string) => {
        return (parseFloat(price) * 0.57).toString();
    };
    // Calculating and formatting the prices
    const fiftySevenPercentOfFormattedPriceAfterPurchase = calculateFiftySevenPercent(formattedPriceAfterPurchase);
    const formattedPriceAfterPurchaseYouKeep = formatPriceWithCommasAndDecimals(fiftySevenPercentOfFormattedPriceAfterPurchase);

    let formattedNewPriceAfterPurchaseYouKeep = "...";
    if (formattedNewPriceAfterPurchaseWithCommasAndDecimals !== "...") {
        const fiftySevenPercentOfFormattedNewPriceAfterPurchase = calculateFiftySevenPercent(formattedNewPriceAfterPurchaseWithCommasAndDecimals);
        formattedNewPriceAfterPurchaseYouKeep = formatPriceWithCommasAndDecimals(fiftySevenPercentOfFormattedNewPriceAfterPurchase);
    }  
//Formatted Price

// Hide and show assets below

    const tokenURI = nft.tokenURI; 
    const getLocalStorageKey = (tokenURI: string) => `assetVisibility-${tokenURI}`;

    // Function to initialize the visibility state for each NFT
    const initialVisibilityState = (tokenURI: string) => {
        const key = getLocalStorageKey(tokenURI);
        return localStorage.getItem(key) !== 'hidden';
    };

    const [hiddenAssetOwner, setHiddenAssetOwner] = useState(() => !initialVisibilityState(props.nft.tokenURI));
    const [shownAssetOwner, setShownAssetOwner] = useState(() => initialVisibilityState(props.nft.tokenURI));
    const [shownAssetNotOwner, setShownAssetNotOwner] = useState(() => false);

    // Function to hide an NFT
    const hideAsset = (tokenURI: string) => {
        const key = getLocalStorageKey(tokenURI);
        localStorage.setItem(key, 'hidden');
        setHiddenAssetOwner(true);
        setShownAssetOwner(false);
        setShownAssetNotOwner(false);
    };

    // Function to show an NFT
    const showAsset = (tokenURI: string) => {
        const key = getLocalStorageKey(tokenURI);
        localStorage.setItem(key, 'visible');
        setHiddenAssetOwner(false);
        setShownAssetOwner(true);
        setShownAssetNotOwner(false);
    };

    useEffect(() => {
        if (addressMatch) {
            // User is the owner
            if (!initialVisibilityState(props.nft.tokenURI)) {
                setHiddenAssetOwner(true);
                setShownAssetOwner(false);
                setShownAssetNotOwner(false);
            } else {
                setHiddenAssetOwner(false);
                setShownAssetOwner(true);
                setShownAssetNotOwner(false);
            }
        } else {
            // User is not the owner
            setHiddenAssetOwner(false);
            setShownAssetOwner(false);
            setShownAssetNotOwner(initialVisibilityState(props.nft.tokenURI));
        }
    }, [addressMatch, props.nft.tokenURI]);
// Hide and show assets above  



    const [imageSrc, setImageSrc] = useState<string>();

    // Update imageSrc when meta changes
    useEffect(() => {
        setImageSrc(meta?.imageURL);
    }, [meta]);

    const handleImageError = () => {
        setImageSrc('/images/fallback.jpg'); // Set to fallback image URL on error
    };

  return (
    <>

        {hiddenAssetOwner && (
          <>
            <div id="blue-orange-seller-created-owner">
                <button id="hide-show-button"
                  onClick={() => 
                    showAsset(props.nft.tokenURI)}>
                      SHOW
                </button>
                {meta ? (
                  <Image
                  loader={imageLoader}
                  onError={handleImageError}
                  alt=""
                  width={200}  
                  height={200}  
                  id="photo-asset-owned-hidden" 
                  src={imageSrc || '/images/fallback.jpg'}
                  style={{ visibility: isImageLoaded ? 'visible' : 'hidden' }}
                   onLoad={() => setIsImageLoaded(true)}

                />
                ) : (
                  <div id="photo-asset-loading-hidden">
                    <Image
                      loader={imageLoader}
                      alt=""
                      width={50}  
                      height={50}  
                      id="receiving-image" 
                      src="/images/market/receiving.png"
                    />
                  <div className={styles.photoloader}></div>  
                  <p id="receiving-word">RECEIVING</p>
                </div>
                )}
                <div id="hidden-from-public"></div> 
                <p id="hidden-word-one">Hidden</p>
            </div>
          </>
        )}
        {shownAssetOwner && (
          <>
          <div id="blue-orange-seller-created-owner">
              <button id="hide-show-button"
                onClick={() => 
                  hideAsset(props.nft.tokenURI)}>
                    HIDE
              </button>
            {/*  Change below link after test  */}
            {meta ? (
            <Link legacyBehavior 
            href={`/asset/${storeAddressFromURL}/${nft.id}`} 
            passHref>
            <a id="photo-link-seller-created">
            <Image
                  loader={imageLoader}
                  onError={handleImageError}
                  alt=""
                  width={200}  
                  height={200}  
                  id="photo-asset-owned" 
                  src={imageSrc || '/images/fallback.jpg'}
                  style={{ visibility: isImageLoaded ? 'visible' : 'hidden' }}
                   onLoad={() => setIsImageLoaded(true)}

              />
            </a>
          </Link>
            ) : (
              <div id="photo-asset-loading">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={50}  
                    height={50}  
                    id="receiving-image" 
                    src="/images/market/receiving.png"
                  />
                <div className={styles.photoloader}></div>  
                <p id="receiving-word">RECEIVING</p>
              </div>
            )}


  {/* Below for owners of the Assets */}	
              {connectedOwnerNotListedNotMintedNotRelisted && (
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
                          <p id="PAP-seller-created">Buyer Keeps</p>
                          <p id="PAP-blue-orange-before-seller-created">
                            <Image
                            loader={imageLoader}
                            alt=""
                            width={18}  
                            height={16}  
                            id="polygon-logo-pap" 
                            src="/images/market/polygon.png"
                          />...
                          </p>
                          <hr id="priceline-seller-created" />
                          <p id="yourprice-seller-created">Price</p>
                          <p id="price-blue-orange-before-seller-created">
                            <Image
                            loader={imageLoader}
                            alt=""
                            width={18}  
                            height={16}  
                            id="polygon-logo" 
                            src="/images/market/polygon.png"
                          />...
                          </p>
                      </div>
  {/* change below link after test */}                
                      <Link legacyBehavior href={`/sell/${address}/${nft.id}`} passHref>
                        <button id="blue-orange-add-to-cart-seller-created" >
                          SET PRICE</button>
                      </Link>
                  </>
              )}	
              {connectedOwnerListedNotMintedNotRelisted && (
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
                        <p id="PAP-seller-created">Buyer Keeps</p>
                        <p id="PAP-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo-pap" 
                          src="/images/market/polygon.png"
                        /> 
                          {formattedPriceAfterPurchaseYouKeep}
                          </p>
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        /> 
                          {formattedPriceWithCommasAndDecimals}
                          </p>
                    </div>    
  {/* change below link after test */}                             
                    <Link legacyBehavior href={`/sell/${address}/${nft.id}`} passHref>
                      <button id="blue-orange-add-to-cart-seller-created-selling" >
                        EDIT</button>
                    </Link>
                </>
            )}	      
            {connectedOwnerListedMintedNotRelisted && (
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
                        <p id="PAP-seller-created">Your Buyer Keeps</p>
                          <p id="PAP-blue-orange-before-seller-created">
                          <Image
                            loader={imageLoader}
                            alt=""
                            width={18}  
                            height={16}  
                            id="polygon-logo-pap" 
                            src="/images/market/polygon.png"
                          />...
                          </p>
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        /> 
                          {formattedPriceWithCommasAndDecimals}
                          </p>
                    </div>  
  {/* change below link after test */}                               
                      <Link legacyBehavior href={`/sell/${address}/${nft.id}`} passHref>
                        <button id="blue-orange-add-to-cart-seller-created" >
                          SET PRICE</button>
                      </Link>
                </>
            )}	   
            {connectedOwnerListedMintedRelisted && (
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
                        <p id="PAP-seller-created">Buyer Keeps</p>
                        {!isLoadingNewPrice && (
                          <p id="PAP-blue-orange-before-seller-created">
                          <Image
                            loader={imageLoader}
                            alt=""
                            width={18}  
                            height={16}  
                            id="polygon-logo-pap" 
                            src="/images/market/polygon.png"
                          /> 
                              {formattedNewPriceAfterPurchaseYouKeep}
                          </p>
                        )}
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        /> 
                          {formattedPriceWithCommasAndDecimals}
                        </p>
                    </div>  
  {/* change below link after test */}                               
                    <Link legacyBehavior href={`/sell/${address}/${nft.id}`} passHref>
                      <button id="blue-orange-add-to-cart-seller-created-selling" >
                        EDIT</button>
                    </Link>
                </>
            )}	       
    {/* Above for users who are owners of the Assets */}     

              
          </div>           
        </>           
        )}


















        {shownAssetNotOwner && (
          <>
          <div id="blue-orange-seller-created">
            {/*  Change below link after test  */}
            {meta ? (
            <Link legacyBehavior 
            href={`/asset/${storeAddressFromURL}/${nft.id}`} 
            passHref>
            <a id="photo-link-seller-created">
            <Image
                  loader={imageLoader}
                  onError={handleImageError}
                  alt=""
                  width={200}  
                  height={200}  
                  id="photo-asset-owned" 
                  src={imageSrc || '/images/fallback.jpg'}
                  style={{ visibility: isImageLoaded ? 'visible' : 'hidden' }}
                   onLoad={() => setIsImageLoaded(true)}
              />
            </a>
          </Link>
            ) : (
              <div id="photo-asset-loading">
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={50}  
                    height={50}  
                    id="receiving-image" 
                    src="/images/market/receiving.png"
                  />
                <div className={styles.photoloader}></div>  
                <p id="receiving-word">RECEIVING</p>
              </div>
            )}
            

    {/* Below for users not connected */}        
              {notConnectedNotListed &&  (
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
                        <p id="PAP-seller-created">You Keep</p>
                        <p id="PAP-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo-pap" 
                          src="/images/market/polygon.png"
                        />...
                        </p>
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        />...
                        </p>
                      </div>
                      <button id="not-for-sale">
                      OWNED</button>
                  </>
              )}	
              {notConnectedListed  &&  (
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
                      <p id="PAP-seller-created">You Keep</p>
                      <p id="PAP-blue-orange-before-seller-created">
                      <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo-pap" 
                          src="/images/market/polygon.png"
                        /> 
                        ...
                        </p>
                      <hr id="priceline-seller-created" />
                      <p id="yourprice-seller-created">Price</p>
                      <p id="price-blue-orange-before-seller-created">
                      <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                      </p>
                  </div>        
  {/* change below link after test */}                      
                    <button id="not-for-sale">
                      OWNED</button> 
                </>
              )}	
    {/* Above for users who are not connected */}


    {/* Below for users who are not owners of the Assets */}
              {connectedBuyerNotListedNotMintedNotRelisted &&  (
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
                        <p id="PAP-seller-created">You Keep</p>
                        <p id="PAP-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo-pap" 
                          src="/images/market/polygon.png"
                        />...
                        </p>
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        />...
                        </p>
                      </div>
                      <button id="not-for-sale">
                      OWNED</button>
                  </>
              )}	

              {connectedBuyerListedNotMintedNotRelisted &&  (
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
                      <p id="PAP-seller-created">You Keep</p>
                      <p id="PAP-blue-orange-before-seller-created">
                      <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo-pap" 
                          src="/images/market/polygon.png"
                        /> 
                        {formattedPriceAfterPurchaseYouKeep}
                      </p>
                      <hr id="priceline-seller-created" />
                      <p id="yourprice-seller-created">Price</p>
                      <p id="price-blue-orange-before-seller-created">
                      <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        />   
                        {formattedPriceWithCommasAndDecimals}
                      </p>
                  </div>        
  {/* change below link after test */}                      
                  <Link legacyBehavior href={`/buy/${storeAddressFromURL}`} passHref>
                    <button id="blue-orange-add-to-cart-seller-created-selling" >
                      SELLING</button>
                  </Link>
                </>
              )}	

              {connectedBuyerListedMintedNotRelisted &&  (
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
                        <p id="PAP-seller-created">You Keep</p>
                        <p id="PAP-blue-orange-before-seller-created"> 
                        <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo-pap" 
                          src="/images/market/polygon.png"
                        />...
                        </p>
                        <hr id="priceline-seller-created" />
                        <p id="yourprice-seller-created">Price</p>
                        <p id="price-blue-orange-before-seller-created">
                          <Image
                            loader={imageLoader}
                            alt=""
                            width={18}  
                            height={16}  
                            id="polygon-logo" 
                            src="/images/market/polygon.png"
                          /> 
                          {formattedPriceWithCommasAndDecimals}
                        </p>
                      </div>
                      <button id="not-for-sale">
                      OWNED</button>
                  </>
              )}	            
              {connectedBuyerListedMintedRelisted &&  (
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
                      <p id="PAP-seller-created">You Keep</p>
                      <p id="PAP-blue-orange-before-seller-created">
                      <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo-pap" 
                          src="/images/market/polygon.png"
                        /> 
                        {formattedNewPriceAfterPurchaseYouKeep}
                      </p>
                      <hr id="priceline-seller-created" />
                      <p id="yourprice-seller-created">Price</p>
                      <p id="price-blue-orange-before-seller-created">
                      <Image
                          loader={imageLoader}
                          alt=""
                          width={18}  
                          height={16}  
                          id="polygon-logo" 
                          src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                      </p>
                  </div>        
  {/* change below link after test */}                      
                  <Link legacyBehavior href={`/buy/${storeAddressFromURL}`} passHref>
                    <button id="blue-orange-add-to-cart-seller-created-selling" >
                      SELLING</button>
                  </Link>
                </>
              )}	
        {/* for sale functions above  */}    


  {/* Above for users who are not owners of the Assets */}     
              
          </div>           
        </>   

        )}
    </>
  );
});

export default StoreAssetHolder;
