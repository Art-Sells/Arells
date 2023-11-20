'use client'

// asset components (change below links after test)
import { BigNumber, ethers } from "ethers";
import useSigner from "../../../state/signer";
import useNFTMarket from "../../../state/nft-market";
import { ipfsToHTTPS } from "../../../helpers";
import { NFT } from "../../../state/nft-market/interfaces"

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';
import "../../../app/css/modals/copiedlink.css"

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from "next/router";
import {Input} from "./PriceInputs/Input";
import { toast } from "react-toastify";

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
    // DELETE AFTER TEST (Modal As Well)
    const [showCopiedLink, setCopiedLink] = useState(false);
    const closeCopiedLink = () => {
        setCopiedLink(false);
    };


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
  //Change below link after test
          router.push(`/test/owned/${address}`);
        } catch (e) {
          showErrorToast();
          console.error(e);
        }
      };
      async function listToSell() {
        try {
            if (!address) {
                await connectWallet(); 
                return; 
            }
    
            if (address && walletAddress == storeAddressFromURL) {
                setError(""); // Clear any previous errors
    
                if (!price) {
                    setError("Price is required");
                    return;
                }

                if (!priceAfterPurchase) {
                    setError("Price After Purchase is required");
                    return;
                }
    
                const weiPrice = ethers.utils.parseEther(price);
                if (weiPrice.lte(0)) {
                    setError("Price must be greater than 0");
                    return;
                }

                const weiPriceAfterPurchase = ethers.utils.parseEther(
                    priceAfterPurchase);
                if (weiPriceAfterPurchase.lte(0)) {
                    setError("Price After Purchase must be greater than 0");
                    return;
                }    
                if (weiPriceAfterPurchase.lt(weiPrice)) {
                    setError("Price After Purchase must be greater than or equal to the original price");
                    return;
                }
                await onSellConfirmed(weiPrice, weiPriceAfterPurchase); // Ensure this is awaited
            }
        } catch (e) {
            console.error("Error in listing NFT:", e);
            // Handle the error appropriately (e.g., set an error state, show a message, etc.)
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

    const [priceAfterPurchaseNum, setPriceAfterPurchaseNum] = useState(0);
    const [youKeepAfterPurchaseNum, setYouKeepAfterPurchaseNum] = useState("0.00");
    const [buyerKeepsAfterPurchaseNum, setBuyerKeepsAfterPurchaseNum] = useState("0.00");
    const [feesAfterPurchaseNum, setFeesAfterPurchaseNum] = useState("0.00");

    useEffect(() => {
        setPriceAfterPurchaseNum(formattedPrice * 2);
    }, [formattedPrice]); 

    useEffect(() => {
        setYouKeepAfterPurchaseNum((priceAfterPurchaseNum * 0.50).toFixed(2));
        setBuyerKeepsAfterPurchaseNum((priceAfterPurchaseNum * 0.47).toFixed(2));
        setFeesAfterPurchaseNum((priceAfterPurchaseNum * 0.03).toFixed(2));
    }, [priceAfterPurchaseNum]);


    const onSellConfirmedMinted = async (
        priceAfterPurchaseNum: BigNumber) => {
        try {
          await listNFTCollector(nft.id, priceAfterPurchaseNum);
          toast.success("You listed this NFT for sale. Changes will be reflected shortly.");
  //Change below link after test
          router.push(`/test/owned/${address}`);
        } catch (e) {
          showErrorToast();
          console.error(e);
        }
    };

    async function listToSellMinted() {
        console.log("on Sell function clicked");
        try {
            if (!address) {
                await connectWallet(); 
                return; 
            }
    
            if (address && walletAddress === storeAddressFromURL) {
                setError(""); // Clear any previous errors
    
                if (!priceAfterPurchaseNum) {
                    setError("Price After Purchase is required");
                    return;
                }
    
                // Check if priceAfterPurchaseNum is less than formattedPrice
                if (priceAfterPurchaseNum < formattedPrice) {
                    setError("Price After Purchase must be greater than or equal to the original price");
                    setCopiedLink(true); // Assuming this is the correct function to show the modal/message
                    return; // Exit the function early
                }

                else {
                                    // Ensure priceAfterPurchaseNum is a string before converting it to Wei
                const etherPriceAfterPurchase = priceAfterPurchaseNum.toString();
        
                // Convert the string to Wei
                const weiPriceAfterPurchaseNum = ethers.utils.parseEther(etherPriceAfterPurchase);
        
                // Continue with the listing process...
                await onSellConfirmedMinted(weiPriceAfterPurchaseNum); // Ensure this is awaited
                }
            }
        } catch (e) {
            console.error("Error in listing NFT:", e);
            // Handle the error appropriately
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
        {showCopiedLink && (
			<div id="copiedLink">

				<div className="modal-content">
                <Image 
                    loader={imageLoader}
                    alt="" 
                    width={100}
                    height={20}
                    id="price-after-purchase-modal" 
                    src="/images/PriceAfterPurchaseLogoIvory.png"/>  
				<p>Price After Purchase</p>
                <p>Must Be at least 2x of Price</p>
				<button className="close"
					onClick={closeCopiedLink}>OK</button>	
				</div>
			</div>	
		)}


        {showLoading && (
            <div id="spinnerBackground">
            <Image 
                loader={imageLoader}
                alt="" 
                width={29}
                height={30}
                id="arells-loader-icon" 
                src="/images/Arells-Icon.png"/>        
            </div>
        )}
        {showLoading && (
            <div className={styles.spinner}></div>
        )}  

{/*<!-- Modals Above -->*/}
        <p id="slogan-blue-orange">SET PRICE TO SELL</p>

        <div id="blue-orange">
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
            {
                isNFTMinted ? (
                    <div>
                        <h3 id="name-blue-orange">{meta?.name}</h3> 
                        <div id="blue-orange-prices-before-blue-orange">
                            <p id="yourprice-blue-orange">Price</p>
                            <p id="price-blue-orange">{formatNumber(formattedPrice)}</p>
                            <p id="PAP-blue-orange">Creator Keeps</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(youKeepAfterPurchaseMinted))}</p>
                            <p id="PAP-blue-orange">You Keep</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(buyerKeepsAfterPurchaseMinted))}</p>
                            <p id="PAP-blue-orange">Fees</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(feesAfterPurchaseMinted))}</p>
                        <hr id="priceline-blue-orange" />
                            <p id="PAP-blue-orange">Price After Purchase</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(priceAfterPurchaseNum)}</p>
                            <p id="PAP-blue-orange">Creator Keeps</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(youKeepAfterPurchaseNum))}</p>
                            <p id="PAP-blue-orange">Your Buyer Keeps</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(buyerKeepsAfterPurchaseNum))}</p>
                            <p id="PAP-blue-orange">Fees</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(feesAfterPurchaseNum))}</p>
                        <hr id="priceline-blue-orange" />   
                            <p id="yourprice-blue-orange">SET PRICE AFTER PURCHASE</p> 
                            <Input
                                name="priceAfterPurchaseNum"
                                id="price"
                                type="tel"
                                onChange={(e) => setPriceAfterPurchaseNum(parseFloat(e.target.value))}
                            />
                        </div>
                        <button id="blue-orange-add-to-cart-connected-blue-orange" 
                        // change below function after test
                        onClick={listToSellMinted}
                        >
                        LIST TO SELL</button>   
                    </div>
                ) : (
                    <div>
                        <h3 id="name-blue-orange">{meta?.name}</h3> 
                        <div id="blue-orange-prices-before-blue-orange">
                            <p id="PAP-blue-orange">Price After Purchase</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(priceAfterPurchase)}</p>
                            <p id="PAP-blue-orange">You Keep</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(youKeepAfterPurchase))}</p>
                            <p id="PAP-blue-orange">Your Buyer Keeps</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(buyerKeepsAfterPurchase))}</p>
                            <p id="PAP-blue-orange">Fees</p>
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(parseFloat(feesAfterPurchase))}</p>
                        <hr id="priceline-blue-orange" />
                            <p id="yourprice-blue-orange">Price</p>
                            <p id="price-blue-orange">{formatNumber(priceNum)}</p>
                            <p id="yourprice-blue-orange">You Keep</p>
                            <p id="price-blue-orange">{formatNumber(parseFloat(youKeep))}</p>
                            <p id="yourprice-blue-orange">Fees</p>
                            <p id="price-blue-orange">{formatNumber(parseFloat(fees))}</p>
                        <hr id="priceline-blue-orange" />   
                            <p id="yourprice-blue-orange">SET PRICE</p> 
                            <Input
                                name="price"
                                id="price"
                                type="tel"
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                        <button id="blue-orange-add-to-cart-connected-blue-orange" 
                        // change below function after test
                        onClick={listToSell}
                        >
                        LIST TO SELL</button>   
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
