'use client'

// asset components (change below links after test)
import useSigner from "../../state/signer";
import { ipfsToHTTPS } from "../../helpers";
import { NFT } from "../../state/nft-market/interfaces"


// Change below link after test
import '../../app/css/prototype/seller-created.css';
import "../../app/css/modals/create-sell-error.css";
import "../../app/css/modals/create-art-modal.css";
import "../../app/css/modals/created-art-modal.css";

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import stylings from '../../app/css/modals/loading/loading.module.css';
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


const StoreAssetHolderSelling = React.memo((props: AssetStoreProps) => {


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

//Modal Functions below
  const [shareToSellModal, setShareToSellModal] = useState<boolean>(false);
  const [showBuyingModal, setBuyingModal] = useState<boolean>(false);
  const [showBuyingErrorModal, setBuyingErrorModal] = useState<boolean>(false);
  const [showPurchasedModal, setPurchasedModal] = useState<boolean>(false);

  const closeShareToSellModal = () => {
    setShareToSellModal(false);
    window.location.reload();
  };
  function shareToSell() {
    setShareToSellModal(true);
  };

  const closeBuyingErrorModal = () => {
    setBuyingErrorModal(false);
    window.location.reload();
  };
//Modal Functions Above

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

// asset constants above


// Asset Changing function/s below 
  const [meta, setMeta] = useState<AssetStoreMetadata>({ name: '', imageURL: '' });

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

    const notConnectedListedNotMintedNotRelisted = 
    !addressMatch && !address && forSale && !isNFTMinted; 
    const notConnectedListedMintedRelisted = 
    !addressMatch && !address && forSale && isNFTMinted; 
 
    const connectedBuyerListedNotMintedNotRelisted = 
    !addressMatch && address && forSale && !isNFTMinted && !forSaleMinted; 
    const connectedBuyerListedMintedRelisted = 
    !addressMatch && address && forSale && isNFTMinted && forSaleMinted; 

    const connectedOwnerListedNotMintedNotRelisted = 
    addressMatch && address && forSale && !isNFTMinted && !forSaleMinted; 
    const connectedOwnerListedMintedRelisted = 
    addressMatch && address && forSale && isNFTMinted && forSaleMinted; 
// Asset Changing function/s above 

//Buying functions Below
  const {buyNFT} = useNFTMarket(address ?? null);
  const [error, setError] = useState<string>();

  const [isBuying, setIsBuying] = useState(false);
  const onBuyClicked = async () => {
      try {
        await buyNFT(nft);
        toast.success("You bought this NFT. Changes will be reflected shortly.");
        
      } catch (e) {
        showErrorToast();
        console.error(e);
      }
    };
    
  async function buy() {
      try {
        setIsBuying(true);
        const delay = (ms: number | undefined) => 
        new Promise(resolve => setTimeout(resolve, ms));
          if (!address) {
              await connectWallet(); 
              return; 
          }
          if (address) {
              setBuyingModal(true);
              await delay(1000);
              await onBuyClicked();
              setBuyingModal(false);
              setPurchasedModal(true);
          }
      } catch (e) {
          setBuyingModal(false);
          setBuyingErrorModal(true);
          console.error("Error in buying NFT:", e);
      }
  }
//Buying Functions Above

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
    const storedValue = localStorage.getItem(key);
    console.log(`Initial local storage value for ${tokenURI}: ${storedValue}`);
    return storedValue !== 'hidden';
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
      console.log(`Hiding asset with tokenURI: ${tokenURI}`);
  };

  // Function to show an NFT
  const showAsset = (tokenURI: string) => {
      const key = getLocalStorageKey(tokenURI);
      localStorage.setItem(key, 'visible');
      setHiddenAssetOwner(false);
      setShownAssetOwner(true);
      setShownAssetNotOwner(false);
      console.log(`Showing asset with tokenURI: ${tokenURI}`);
  };

  useEffect(() => {
    console.log(`Effect triggered for tokenURI: ${props.nft.tokenURI}`);
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
  console.log(`Rendering with states - hiddenAssetOwner: ${hiddenAssetOwner}, shownAssetOwner: ${shownAssetOwner}, shownAssetNotOwner: ${shownAssetNotOwner}`);

// Hide and show assets above 


  return (
    <>
      {/*<!-- Modals below link after test -->*/}

      {shareToSellModal && (
        <div id="owner-error-wrapper">
          <div id="owner-error-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={30}
            height={30}
            id="owner-error-image" 
            src="/images/market/prohibited.png"/>  
          <p id="owner-error-word">OWNER CANNOT BUY</p>
          <button id="owner-error-close"
            onClick={closeShareToSellModal}>OK</button> 
          </div>
        </div>  
      )}  



      {showBuyingModal && (
        <div id="create-art-modal-wrapper">
          <div id="buying-art-modal-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={50}
            height={50}
            id="buy-art-image" 
            src="/images/market/cash-register.png"/>  
          <p id="buying-art-words">BUYING</p>
          <p id="arells-digital-asset">Arells Digital Asset</p>
          <div className={stylings.loading}></div>
          <Image 
            alt="" 
            width={9}
            height={9}
            id="arells-digital-asset-icon" 
            src="/images/Arells-Icon.png"/>
          </div>
        </div>  
      )}

      {showBuyingErrorModal && (
        <div id="creation-error-wrapper">
          <div id="buying-error-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={35}
            height={35}
            id="creation-error-image" 
            src="/images/market/wallet.png"/>  
          <p id="creation-error-words">CHECK WALLET</p>
          <button id="creation-error-close"
            onClick={closeBuyingErrorModal}>OK</button> 
          </div>
        </div>  
      )}

      {showPurchasedModal && (
        <div id="created-art-modal-wrapper">
          <div id="purchased-art-modal-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={63}
            height={50}
            id="purchased-art-image" 
            src="/images/market/deliver.png"/>  
          <p id="purchased-art-words">ART PURCHASED</p>
          <p id="created-art-paragraph">It'll take a few moments</p>
          <p id="created-art-paragraph">for your art to be delivered</p>
          <p id="created-art-paragraph">to your store.</p>
          <Link href={`/own/${address}`} passHref>
            <button id="created-art-modal-close">DELIVER ART</button>  
          </Link>   

          </div>
        </div>  
      )}    


      {/*<!-- Modals Above -->*/}

      {hiddenAssetOwner && (
          <>
            <div id="blue-orange-seller-created-owner">
                <button id="hide-show-button"
                  onClick={() => 
                    showAsset(props.nft.tokenURI)}>
                      SHOW
                </button>
                {meta && (
                  <Image
                    loader={imageLoader}
                    alt=""
                    width={202}  
                    height={202}  
                    id="photo-asset-owned-hidden" 
                    src={meta?.imageURL}
                  />
                )}
                {!meta && (
                    (
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
                    )
                  )}  
                <div id="hidden-from-public"></div> 
                <p id="hidden-word-one">Hidden</p>
            </div>
          </>
        )}













      {shownAssetOwner && (
        <div id="blue-orange-seller-created-owner">
          <button id="hide-show-button"
            onClick={() => 
              hideAsset(props.nft.tokenURI)}>
                HIDE
          </button>
        {/*  Change below link after test  */}
        {meta && (
          <Link legacyBehavior 
            href={`/asset/${storeAddressFromURL}/${nft.id}`} 
            passHref>
            <a id="photo-link-seller-created">
              <Image
                loader={imageLoader}
                alt=""
                width={202}  
                height={202}  
                id="photo-asset-owned" 
                src={meta?.imageURL}
              />
            </a>
          </Link>
        )}
        {!meta && (
            (
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
            )
          )}  
{/* Below for owners of the Assets */}  
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
            <button id="blue-orange-add-to-cart-seller-created" 
            // change below function after test
            onClick={shareToSell}>
              BUY</button>
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
                <button id="blue-orange-add-to-cart-seller-created" 
                // change below function after test
                onClick={shareToSell}>
                  BUY</button>
            </>
        )}    
{/* Above for users who are owners of the Assets */}          
            
      </div>    
      )}  










      {shownAssetNotOwner && (
        <div id="blue-orange-seller-created">
          {/*  Change below link after test  */}
          {meta && (
            <Link legacyBehavior 
              href={`/asset/${storeAddressFromURL}/${nft.id}`} 
              passHref>
              <a id="photo-link-seller-created">
                <Image
                  loader={imageLoader}
                  alt=""
                  width={202}  
                  height={202}  
                  id="photo-asset-owned" 
                  src={meta?.imageURL}
                />
              </a>
            </Link>
          )}
          {!meta && (
              (
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
              )
            )}  
  {/* Below for users who are not owners of the Assets */} 
          {notConnectedListedNotMintedNotRelisted && (
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
              <button id="blue-orange-add-to-cart-seller-created" 
              disabled={isBuying}
              onClick={buy}>
                BUY</button>
            </>
          )}
          {notConnectedListedMintedRelisted && (
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
              <button id="blue-orange-add-to-cart-seller-created" 
              disabled={isBuying}
              onClick={buy}>
                BUY</button>
            </>
          )}
          {connectedBuyerListedNotMintedNotRelisted && (
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
              <button id="blue-orange-add-to-cart-seller-created" 
              disabled={isBuying}
              onClick={buy}>
                BUY</button>
            </>
          )}
          {connectedBuyerListedMintedRelisted && (
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
              <button id="blue-orange-add-to-cart-seller-created" 
              disabled={isBuying}
              onClick={buy}>
                BUY</button>
            </>
          )}
  {/* Above for users who are not owners of the Assets */}     
        </div>
      )}
    </>
  );
});

export default StoreAssetHolderSelling;

function showErrorToast() {
  throw new Error("Function not implemented.");
}
