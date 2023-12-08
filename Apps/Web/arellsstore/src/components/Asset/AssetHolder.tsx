'use client'

// asset components
import { BigNumber, ethers } from "ethers";
import useSigner from "../../state/signer";
import useNFTMarket from "../../state/nft-market";
import { ipfsToHTTPS } from "../../helpers";
import { NFT } from "../../state/nft-market/interfaces"

// Change below link after test
import '../../app/css/prototype/asset/asset.css';
import "../../app/css/modals/create-sell-error.css";
import "../../app/css/modals/create-art-modal.css";
import "../../app/css/modals/created-art-modal.css";

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styling from '../../app/css/modals/loading/loader.module.css';
import styles from '../../app/css/modals/loading/photoloaderasset.module.css';

import { useEffect, useMemo, useState } from 'react';
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
    const [showPriceErrorModal, setPriceErrorModal] = useState<boolean>(false);
    const [showPAPErrorModal, setPAPErrorModal] = useState<boolean>(false);

    const [showListingModal, setListingModal] = useState<boolean>(false);
    const [showListingErrorModal, setListingErrorModal] = useState<boolean>(false);

    const [showListedModal, setListedModal] = useState<boolean>(false);

    const closePriceErrorModal = () => {
        setPriceErrorModal(false);
        window.location.reload();
    };
    
    const closePAPErrorModal = () => {
        setPAPErrorModal(false);
        window.location.reload();

    };
    
    const closeListingErrorModal = () => {
        setListingErrorModal(false);
        window.location.reload();
    };
      
    const { nft } = props; 
    const [meta, setMeta] = useState<AssetMetadata>();
    const {address, connectWallet} = useSigner();
    const router = useRouter();
    const walletAddress = address ? address.toLowerCase() : null;
    const storeAddressFromURL = useMemo(() => {
        const address = Array.isArray(router.query.storeAddress)
            ? router.query.storeAddress[0]
            : router.query.storeAddress;
        return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);
// asset constants above

// Asset Changing function/s below 
    useEffect(() => {
      const fetchMetadata = async () => {
        const metadataResponse = await fetch(ipfsToHTTPS(nft.tokenURI));
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


//Price & Price Affter Purchase Front-End Systems Below


    const {listNFTCreator, listNFTCollector} = useNFTMarket(storeAddressFromURL);
    const [error, setError] = useState<string>();
    const [price, setPrice] = useState("0.00");
    const [priceAfterPurchase, setPriceAfterPurchase] = useState("0.00");
    const [youKeepAfterPurchase, setYouKeepAfterPurchase] = useState("0.00");
    const [buyerKeepsAfterPurchase, setBuyerKeepsAfterPurchase] = useState("0.00");
    const [feesAfterPurchase, setFeesAfterPurchase] = useState("0.00");
    const [youKeep, setYouKeep] = useState("0.00");
    const [fees, setFees] = useState("0.00");

    const priceNum = parseFloat(price);

    const formatNumber = (num: string | number) => {
        // If the input is an empty string or exactly zero, format it directly
        if (num === '' || num === '0' || num === 0) {
            return new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2, // Ensure that there are always two decimal places
            }).format(0);
        }
    
        // For non-zero numbers, parse and format them
        const number = typeof num === 'string' ? parseFloat(num) : num;
        if (!isNaN(number)) {
            return new Intl.NumberFormat('en-US', {
                style: 'decimal',
                maximumFractionDigits: 2,
            }).format(number);
        }
    
        return "0.00"; // Return a default value if the input is not a valid number
    };
    
    useEffect(() => {
        if (price.trim() !== "" && !isNaN(priceNum))  {
            const doubledPrice = priceNum * 2;
            setPriceAfterPurchase(doubledPrice.toString());
        
            // Calculating percentages for Price After Purchase
            setYouKeepAfterPurchase((doubledPrice * 0.50).toFixed(2));
            setBuyerKeepsAfterPurchase((doubledPrice * 0.47).toFixed(2));
            setFeesAfterPurchase((doubledPrice * 0.03).toFixed(2));
        
            // Calculating percentages for Price
            setYouKeep((priceNum * 0.97).toFixed(2));
            setFees((priceNum * 0.03).toFixed(2));
        } else {
            setPriceAfterPurchase("0.00");
            setYouKeepAfterPurchase("0.00");
            setBuyerKeepsAfterPurchase("0.00");
            setFeesAfterPurchase("0.00");
            setYouKeep("0.00");
            setFees("0.00");
        }
    }, [price]);
    
    
    const onSellConfirmed = async (
        price: BigNumber, 
        priceAfterPurchase: BigNumber) => {
        try {
          await listNFTCreator(nft.id, price, priceAfterPurchase);
          toast.success("You listed this NFT for sale. Changes will be reflected shortly.");
        } catch (e) {
          showErrorToast();
          console.error(e);
        }
      };
      const [isListing, setIsListing] = useState(false); 
      const delay = (ms: number | undefined) => 
        new Promise(resolve => setTimeout(resolve, ms)); 
      async function listToSell() {
        try {
            setIsListing(true);
            if (!address) {
                await connectWallet(); 
                return; 
            }
    
            if (address && walletAddress == storeAddressFromURL) {
                setError(""); // Clear any previous errors
    
                if (!price) {
                    setError("Price is required");
                    setPriceErrorModal(true); 
                    return;
                }
    
                const weiPrice = ethers.utils.parseEther(price);
                if (weiPrice.lte(0)) {
                    setError("Price must be greater than 0");
                    setPriceErrorModal(true); 
                    return;
                }

                const weiPriceAfterPurchase = ethers.utils.parseEther(
                    priceAfterPurchase);

                setListingModal(true);
                await delay(1000);
                await onSellConfirmed(weiPrice, weiPriceAfterPurchase);
                setListingModal(false);
                setListedModal(true);
            }
        } catch (e) {
            console.error("Error in listing NFT:", e);
            setListingModal(false);
            setListingErrorModal(true);
        }
    }

// Minted Sale Confirmation below
    const [youKeepAfterPurchaseMinted, setYouKeepAfterPurchaseMinted] = useState("0.00");
    const [buyerKeepsAfterPurchaseMinted, setBuyerKeepsAfterPurchaseMinted] = useState("0.00");
    const [feesAfterPurchaseMinted, setFeesAfterPurchaseMinted] = useState("0.00");
            // Check if nft.price contains a decimal point
    const formattedPrice = nft.price.includes('.') 
    ? parseFloat(nft.price) 
    : parseFloat(ethers.utils.formatUnits(ethers.BigNumber.from(nft.price), 'ether'));

    useEffect(() => {
        // Set the state values based on the formatted price
        setYouKeepAfterPurchaseMinted((formattedPrice * 0.50).toFixed(2));
        setBuyerKeepsAfterPurchaseMinted((formattedPrice * 0.47).toFixed(2));
        setFeesAfterPurchaseMinted((formattedPrice * 0.03).toFixed(2));
    }, [nft.price]);

    const { priceAfterPurchaseSets = [] } = usePriceAfterPurchaseSets(nft.id);
    const [priceAfterPurchaseNum, setPriceAfterPurchaseNum] = useState(0);

    const [youKeepAfterPurchaseNum, setYouKeepAfterPurchaseNum] = useState("0.00");
    const [buyerKeepsAfterPurchaseNum, setBuyerKeepsAfterPurchaseNum] = useState("0.00");
    const [feesAfterPurchaseNum, setFeesAfterPurchaseNum] = useState("0.00");
    const [inputPriceAfterPurchase, setInputPriceAfterPurchase] = useState(0.00);

    useEffect(() => {
        if (priceAfterPurchaseSets?.length > 0) {
            const newPAP = priceAfterPurchaseSets[0].newPriceAfterPurchase;
            setPriceAfterPurchaseNum(parseFloat(newPAP !== "0" ? newPAP : "0"));
        }
    }, [priceAfterPurchaseSets]);
    useEffect(() => {
        setYouKeepAfterPurchaseNum((inputPriceAfterPurchase * 0.50).toFixed(2));
        setBuyerKeepsAfterPurchaseNum((inputPriceAfterPurchase * 0.47).toFixed(2));
        setFeesAfterPurchaseNum((inputPriceAfterPurchase * 0.03).toFixed(2));
    }, [inputPriceAfterPurchase]);
    const handlePriceAfterPurchaseChange = (e: { target: { value: string; }; }) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            setInputPriceAfterPurchase(value);
            console.log("New inputPriceAfterPurchase:", value); // Log to confirm the update
        }
    };

    const onSellConfirmedMinted = async (
        priceAfterPurchaseNum: BigNumber) => {
        try {
          await listNFTCollector(nft.id, priceAfterPurchaseNum);
          toast.success("You listed this NFT for sale. Changes will be reflected shortly.");
        } catch (e) {
          showErrorToast();
          console.error(e);
        }
    };

    async function listToSellMinted() {
        try {
            setIsListing(true);
            if (!address) {
                await connectWallet(); 
                return; 
            }
    
            if (address && walletAddress === storeAddressFromURL) {
                setError(""); // Clear any previous errors
    
                if (!inputPriceAfterPurchase) {
                    setError("Price After Purchase is required");
                    setPAPErrorModal(true); 
                    return;
                }
                if (inputPriceAfterPurchase == 0) {
                    setError("Price After Purchase is required");
                    setPAPErrorModal(true); 
                    return;
                }
    
                // Check if priceAfterPurchaseNum is less than formattedPrice
                if (inputPriceAfterPurchase < formattedPrice || inputPriceAfterPurchase < (2 * formattedPrice)) {
                    setError("Price After Purchase must be greater than or equal to the original price and less than twice the original price");
                    setPAPErrorModal(true); 
                    return; 
                }

                else {
                    const etherPriceAfterPurchase = inputPriceAfterPurchase.toString();
                    const weiInputPriceAfterPurchase = ethers.utils.parseEther(etherPriceAfterPurchase);
                    setListingModal(true);
                    await delay(1000);
                    await onSellConfirmedMinted(weiInputPriceAfterPurchase);
                    setListingModal(false);
                    setListedModal(true);
                }
            }
        } catch (e) {
            console.error("Error in listing NFT:", e);
            setListingModal(false);
            setListingErrorModal(true);
        }
    };


    

// Minted Sale Confirmation Above
    
//Price & Price Affter Purchase Front-End Systems Above


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



  return (
    <>
{/*<!-- Modals below link after test -->*/} 
    {showPriceErrorModal && (
        <div id="create-sell-error-wrapper">
          <div id="create-sell-error-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={30}
            height={26}
            id="error-price-image" 
            src="/images/market/polygonIvory.png"/>  
          <p id="price-error-word">SET PRICE</p>
          <button id="create-sell-error-close"
            onClick={closePriceErrorModal}>OK</button>	
          </div>
        </div>	
      )}

      {showPAPErrorModal && (
        <div id="pap-error-wrapper">
          <div id="pap-error-content">
          <Image 
              // loader={imageLoader}
              alt="" 
              width={85}
              height={16}
              id="error-pap-image" 
              src="/images/PriceAfterPurchaseLogoIvory.png"/> 
            <hr id="pap-error-line-top"></hr>  
            <p id="pap-error-words">PRICE AFTER PURCHASE</p>
            <hr id="pap-error-line-bottom"></hr>  
            <p id="pap-error-paragraph">Must be at least twice</p>
            <p id="pap-error-paragraph">as much as price.</p>
          <button id="pap-error-close"
              onClick={closePAPErrorModal}>OK</button>	
          </div>
        </div>	
      )}

      {showListingModal && (
        <div id="create-art-modal-wrapper">
          <div id="create-art-modal-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={50}
            height={50}
            id="list-art-image" 
            src="/images/market/listingArtTagImage.png"/>  
          <p id="list-art-words">LISTING ART</p>
          <div className={styling.loader}></div>
          </div>
        </div>	
      )}

      {showListingErrorModal && (
        <div id="creation-error-wrapper">
          <div id="creation-error-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={35}
            height={35}
            id="creation-error-image" 
            src="/images/prototype/cancelled.png"/>  
          <p id="creation-error-words">CANCELED</p>
          <button id="creation-error-close"
            onClick={closeListingErrorModal}>OK</button>	
          </div>
        </div>	
      )}

      {showListedModal && (
        <div id="created-art-modal-wrapper">
          <div id="created-art-modal-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={50}
            height={50}
            id="listed-art-image" 
            src="/images/market/listedArtTag.png"/>  
          <p id="created-art-words">ART LISTED</p>
          <p id="created-art-paragraph">It'll take a few moments</p>
          <p id="created-art-paragraph">for your art to be stocked.</p>
          <Link href={`/buy/${address}`} passHref>
            <button id="created-art-modal-close">VIEW LISTING</button>	
          </Link>   

          </div>
        </div>	
      )}

{/*<!-- Modals Above -->*/}
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
            {isNFTMinted ? (
                    <div>
                        <div id="asset-name-wrapper">
                            <h3 id="name-blue-orange">{meta?.name}</h3> 
                        </div>
                        <div id="blue-orange-prices-before-blue-orange">
                            <div id="asset-price-minted-wrapper">
                                <p id="PAP-not-minted-word">Price</p>
                                <p id="PAP-not-minted-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="pap-polygon-logo-sell" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(formattedPrice)}
                                    </p>
                                <hr id="line-price"></hr>    
                                <p id="PAP-not-minted-other-word">Creator Keeps</p>
                                <p id="PAP-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="pap-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(youKeepAfterPurchaseMinted))}</p>
                                <p id="PAP-not-minted-other-word">You Keep</p>
                                <p id="PAP-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="pap-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(buyerKeepsAfterPurchaseMinted))}</p>
                                <p id="PAP-not-minted-other-word">Fees</p>
                                <p id="PAP-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="pap-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(feesAfterPurchaseMinted))}</p>
                            </div>
                            <div id="asset-price-after-purchase-minted-wrapper">
                                <Image
                                    loader={imageLoader}
                                    alt=""
                                    width={60}  
                                    height={11}  
                                    id="PAP-logo-list-minted" 
                                    src="/images/PriceAfterPurchaseLogo.png"
                                />
                                <hr id="line-pap-minted-top"></hr>
                                <p id="price-not-minted-word">Price After Purchase</p>
                                <p id="price-not-minted-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="price-polygon-logo-sell" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(inputPriceAfterPurchase)}</p>
                                <hr id="line-pap"></hr>    
                                <p id="price-not-minted-other-word">Creator Keeps</p>
                                <p id="price-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="price-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(youKeepAfterPurchaseNum))}</p>
                                <p id="price-not-minted-other-word">Your Buyer Keeps</p>
                                <p id="price-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="price-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(buyerKeepsAfterPurchaseNum))}</p>
                                <p id="price-not-minted-other-word">Fees</p>
                                <p id="price-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={18}  
                                        height={16}  
                                        id="price-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(feesAfterPurchaseNum))}</p>
                            </div> 
                            <Input
                                name="priceAfterPurchaseNum"
                                id="price-after-purchase-price"
                                type="tel"
                                placeholder="Price After Purchase"
                                value={inputPriceAfterPurchase}
                                onChange={handlePriceAfterPurchaseChange}                          
                            />   
                        </div>
                        <button id="blue-orange-add-to-cart-connected-blue-orange" 
                        // change below function after test
                        onClick={listToSellMinted}
                        disabled={isListing}
                        >
                        LIST TO SELL</button>   
                    </div>
                ) : (
                    <div>
                        <div id="asset-name-wrapper">
                            <h3 id="name-blue-orange">{meta?.name}</h3> 
                        </div>
                        <div id="blue-orange-prices-before-blue-orange">
                            <div id="asset-price-after-purchase-wrapper">
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
                                    {formatNumber(priceAfterPurchase)}</p>
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
                                    {formatNumber(parseFloat(youKeepAfterPurchase))}
                                </p>
                                <p id="PAP-not-minted-other-word">Your Buyer Keeps</p>
                                <p id="PAP-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={12}  
                                        height={10}  
                                        id="pap-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(buyerKeepsAfterPurchase))}
                                </p>
                                <p id="PAP-not-minted-other-word">Fees</p>
                                <p id="PAP-not-minted-price-other-price">
                                    <Image
                                        loader={imageLoader}
                                        alt=""
                                        width={12}  
                                        height={10}  
                                        id="pap-polygon-logo-sell-other" 
                                        src="/images/market/polygon.png"
                                    /> 
                                    {formatNumber(parseFloat(feesAfterPurchase))}
                                </p>
                            </div>
                            <div id="asset-price-wrapper">
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
                                        {formatNumber(priceNum)}
                                    </p>
                                    <hr id="line-price"></hr>
                                    <p id="price-not-minted-other-word">You Keep</p>
                                    <p id="price-not-minted-price-other-price">
                                        <Image
                                            loader={imageLoader}
                                            alt=""
                                            width={12}  
                                            height={10}  
                                            id="price-polygon-logo-sell-other" 
                                            src="/images/market/polygon.png"
                                        /> 
                                        {formatNumber(parseFloat(youKeep))}
                                    </p>
                                    <p id="price-not-minted-other-word">Fees</p>
                                    <p id="price-not-minted-price-other-price">
                                        <Image
                                            loader={imageLoader}
                                            alt=""
                                            width={12}  
                                            height={10}  
                                            id="price-polygon-logo-sell-other" 
                                            src="/images/market/polygon.png"
                                        /> 
                                        {formatNumber(parseFloat(fees))}
                                    </p>
                                </div>
                                <Input
                                    name="price"
                                    id="price"
                                    type="tel"
                                    placeholder="Price"
                                    onChange={(e) => setPrice(e.target.value)}
                                />                              
                            </div> 
                            <button id="blue-orange-add-to-cart-connected-blue-orange" 
                                disabled={isListing}
                                onClick={listToSell}
                                >
                                LIST TO SELL
                            </button>    
                    </div>
                )
            } 
                                        
        </div>		   
    </>
  );
};

export default AssetHolder;

function showErrorToast() {
    throw new Error("Function not implemented.");
}
