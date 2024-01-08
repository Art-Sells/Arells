'use client'

// asset components
import { BigNumber, ethers } from "ethers";
import useSigner from "../../state/signer";
import useNFTMarket from "../../state/nft-market";
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
import styles from '../../app/css/modals/loading/photoloaderasset.module.css';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from "next/router";
import {Input} from "./PriceInputs/Input";
import { toast } from "react-toastify";
import { usePriceAfterPurchaseSets } from "../../state/nft-market/usePriceAfterPurchaseSets";
import Link from "next/link";

type AssetMetadata = {
    name: string;
    imageURL: string;
};

type AssetProps = {
    nft: NFT;
    ownerId: string | null;
};

const AssetViewHolder = (props: AssetProps) => {
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
  const [meta, setMeta] = useState<AssetMetadata>();
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

// Display Changing functions below
    const [isNFTMinted, setIsNFTMinted] = useState(false);
    const { checkIfNFTMinted } = useNFTMarket(storeAddressFromURL);

    useEffect(() => {
    const checkMintingStatus = async () => {
        const minted = await checkIfNFTMinted(nft.id);
        setIsNFTMinted(minted);
    };

    checkMintingStatus();
    }, [nft.id, checkIfNFTMinted]);

// Display Changing functions above


// Asset Changing function/s below

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
    const notConnectedNotListedMinted = 
    !addressMatch && !address && !forSale && isNFTMinted; 

    const notConnectedListedNotMintedNotRelisted = 
    !addressMatch && !address && forSale && !isNFTMinted; 
    const notConnectedListedMintedRelisted = 
    !addressMatch && !address && forSale && isNFTMinted; 

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
        <Image
            loader={imageLoader}
            alt=""
            width={78}  
            height={25} 
            id="word-logo-seller-created-asset" 
            src="/images/Arells-Logo-Ebony.png"
        />	
        <p id="slogan-seller-created-asset">BUY ART THAT NEVER LOSES VALUE</p>
        <hr id="black-liner-bottom-owned-buy-asset"/>
        <p id="ada-description-owned-buy-asset">ARELLS DIGITAL ASSETS</p> 
        <div id="asset-component">
            {meta && (
                <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('nftImage')}
                alt=""
                width={400}  
                height={400}
                id="photo-asset"
                src={meta?.imageURL}/>
            )} 
            {!meta && (
                <div id="photo-asset-loading-sell">
                <div className={styles.photoloaderasset}></div>  
                </div>
            )}
            <div id="asset-name-wrapper">
                <h3 id="name-blue-orange">{meta?.name}</h3> 
            </div>




{/* Below for owners of the Assets */}  
        {connectedOwnerNotListedNotMintedNotRelisted && (
            <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        ...</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        ...
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        ...
                    </p>
                    {/* change below link after test */}                
                    <Link legacyBehavior href={`/sell/${address}/${nft.id}`} passHref>
                    <button id="blue-orange-add-to-cart-connected-blue-orange-buy" >
                        SET PRICE</button>
                    </Link>
                </div> 
            </div>  
            </>
        )}	
        {connectedOwnerListedNotMintedNotRelisted && (
          <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceAfterPurchaseWithCommasAndDecimals}</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceAfterPurchaseYouKeep}
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    <button id="blue-orange-add-to-cart-connected-blue-orange-buy" 
                        // change below function after test
                        onClick={shareToSell}>
                        BUY</button>
                </div> 
            </div>       
          </>
        )}
        {connectedOwnerListedMintedNotRelisted && (
            <>
                <div id="blue-orange-prices-before-blue-orange">
                    <div id="asset-price-after-purchase-wrapper-asset">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={60}  
                            height={11}  
                            id="PAP-logo-list" 
                            src="/images/PriceAfterPurchaseLogo.png"
                        />
                        <hr id="line-pap-top"></hr>
                        <p id="PAP-not-minted-word">Price After Purchase</p>
                        <p id="PAP-not-minted-price">
                            <Image
                                loader={imageLoader}
                                alt=""
                                width={15}  
                                height={13}  
                                id="pap-polygon-logo-sell" 
                                src="/images/market/polygon.png"
                            /> 
                            ...</p>
                        <hr id="line-pap"></hr>
                        <p id="PAP-not-minted-other-word">You Keep</p>
                        <p id="PAP-not-minted-price-other-price">
                            <Image
                                loader={imageLoader}
                                alt=""
                                width={12}  
                                height={10}  
                                id="pap-polygon-logo-sell-other" 
                                src="/images/market/polygon.png"
                            /> 
                            ...
                        </p>
                    </div>
                    <div id="asset-price-wrapper-asset">
                        <p id="price-not-minted-word">Price</p>
                        <p id="price-not-minted-price">
                            <Image
                                loader={imageLoader}
                                alt=""
                                width={15}  
                                height={13}  
                                id="price-polygon-logo-sell" 
                                src="/images/market/polygon.png"
                            /> 
                            {formattedPriceWithCommasAndDecimals}
                        </p>
                        {/* change below link after test */}                               
                        <Link legacyBehavior href={`/sell/${address}/${nft.id}`} passHref>
                        <button id="blue-orange-add-to-cart-connected-blue-orange-buy" >
                            SET PRICE</button>
                        </Link>
                    </div> 
                </div>  
            </>
        )}
        {connectedOwnerListedMintedRelisted && (
          <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedNewPriceAfterPurchaseWithCommasAndDecimals}</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedNewPriceAfterPurchaseYouKeep}
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    <button id="blue-orange-add-to-cart-connected-blue-orange-buy" 
                    // change below function after test
                    onClick={shareToSell}>
                        BUY</button>
                </div> 
            </div>       
            </>
        )}    
{/* Above for users who are owners of the Assets */} 



{/* Below for users not connected */}        
        {notConnectedNotListed &&  (
            <>
                <div id="blue-orange-prices-before-blue-orange">
                    <div id="asset-price-after-purchase-wrapper-asset">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={60}  
                            height={11}  
                            id="PAP-logo-list" 
                            src="/images/PriceAfterPurchaseLogo.png"
                        />
                        <hr id="line-pap-top"></hr>
                        <p id="PAP-not-minted-word">Price After Purchase</p>
                        <p id="PAP-not-minted-price">
                            <Image
                                loader={imageLoader}
                                alt=""
                                width={15}  
                                height={13}  
                                id="pap-polygon-logo-sell" 
                                src="/images/market/polygon.png"
                            /> 
                            ...</p>
                        <hr id="line-pap"></hr>
                        <p id="PAP-not-minted-other-word">You Keep</p>
                        <p id="PAP-not-minted-price-other-price">
                            <Image
                                loader={imageLoader}
                                alt=""
                                width={12}  
                                height={10}  
                                id="pap-polygon-logo-sell-other" 
                                src="/images/market/polygon.png"
                            /> 
                            ...
                        </p>
                    </div>
                    <div id="asset-price-wrapper-asset">
                        <p id="price-not-minted-word">Price</p>
                        <p id="price-not-minted-price">
                            <Image
                                loader={imageLoader}
                                alt=""
                                width={15}  
                                height={13}  
                                id="price-polygon-logo-sell" 
                                src="/images/market/polygon.png"
                            /> 
                            ...
                        </p>
                        <button id="not-for-sale">
                            OWNED</button>
                    </div> 
                </div>  
            </>
        )}	
        {notConnectedNotListedMinted  &&  (
        <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        ...</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        ...
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    {/* change below link after test */}                      
                    <button id="not-for-sale">
                        OWNED</button> 
                </div> 
            </div>        
        </>
        )}	
        {notConnectedListedNotMintedNotRelisted && (
        <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceAfterPurchaseWithCommasAndDecimals}</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceAfterPurchaseYouKeep}
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    <button id="blue-orange-add-to-cart-connected-blue-orange-buy" 
                    disabled={isBuying}
                    onClick={buy}>
                    BUY</button>
                </div> 
            </div>              
        </>
        )}
        {notConnectedListedMintedRelisted && (
        <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedNewPriceAfterPurchaseWithCommasAndDecimals}</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedNewPriceAfterPurchaseYouKeep}
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    <button id="blue-orange-add-to-cart-connected-blue-orange-buy" 
                    disabled={isBuying}
                    onClick={buy}>
                    BUY</button>
                </div> 
            </div>         
        </>
        )}
{/* Above for users who are not connected */}


{/* Below for users who are not owners of the Assets */} 
        {connectedBuyerNotListedNotMintedNotRelisted &&  (
        <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        ...</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        ...
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        ...
                    </p>
                    <button id="not-for-sale">
                    OWNED</button>
                </div> 
            </div>  
        </>
        )}	
        {connectedBuyerListedNotMintedNotRelisted && (
        <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceAfterPurchaseWithCommasAndDecimals}</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceAfterPurchaseYouKeep}
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    <button id="blue-orange-add-to-cart-connected-blue-orange-buy" 
                        disabled={isBuying}
                        onClick={buy}>
                        BUY</button>
                </div> 
            </div>        
        </>
        )}
        {connectedBuyerListedMintedNotRelisted && (
        <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        ...</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        ...
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    <button id="not-for-sale">
                    OWNED</button>
                </div> 
            </div>        
        </>
        )}
        {connectedBuyerListedMintedRelisted && (
        <>
            <div id="blue-orange-prices-before-blue-orange">
                <div id="asset-price-after-purchase-wrapper-asset">
                    <Image
                        loader={imageLoader}
                        alt=""
                        width={60}  
                        height={11}  
                        id="PAP-logo-list" 
                        src="/images/PriceAfterPurchaseLogo.png"
                    />
                    <hr id="line-pap-top"></hr>
                    <p id="PAP-not-minted-word">Price After Purchase</p>
                    <p id="PAP-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="pap-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedNewPriceAfterPurchaseWithCommasAndDecimals}</p>
                    <hr id="line-pap"></hr>
                    <p id="PAP-not-minted-other-word">You Keep</p>
                    <p id="PAP-not-minted-price-other-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={10}  
                            id="pap-polygon-logo-sell-other" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedNewPriceAfterPurchaseYouKeep}
                    </p>
                </div>
                <div id="asset-price-wrapper-asset">
                    <p id="price-not-minted-word">Price</p>
                    <p id="price-not-minted-price">
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={15}  
                            height={13}  
                            id="price-polygon-logo-sell" 
                            src="/images/market/polygon.png"
                        /> 
                        {formattedPriceWithCommasAndDecimals}
                    </p>
                    <button id="blue-orange-add-to-cart-connected-blue-orange-buy" 
                    disabled={isBuying}
                    onClick={buy}>
                        BUY</button>
                </div> 
            </div>         
        </>
        )}
  {/* Above for users who are not owners of the Assets */}   
                                        
        </div>		   
    </>
  );
};

export default AssetViewHolder;

function showErrorToast() {
    throw new Error("Function not implemented.");
}
