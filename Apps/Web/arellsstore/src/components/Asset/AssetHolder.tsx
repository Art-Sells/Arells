'use client'

// asset components
import { BigNumber, ethers } from "ethers";
import useSigner from "../../state/signer";
import useNFTMarket from "../../state/nft-market";
import { ipfsToHTTPS } from "../../helpers";
import { NFT } from "../../state/nft-market/interfaces"

// Change below link after test
import '../../app/css/prototype/asset/asset.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';
import "../../app/css/modals/copiedlink.css"

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from "next/router";
import {Input} from "./PriceInputs/Input";
import { toast } from "react-toastify";
import { usePriceAfterPurchaseSets } from "../../state/nft-market/usePriceAfterPurchaseSets";

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
    const [showCopiedLinkPrice, setCopiedLinkPrice] = useState(false);
    const closeCopiedLink = () => {
        setCopiedLink(false);
        setCopiedLinkPrice(false);
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
            //Add Listing Modal "Your Art is being listed to sell. Please wait a few seconds for it to appear in your store."
          router.push(`/buy/${address}`);
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
                    setCopiedLinkPrice(true); 
                    return;
                }

                if (!priceAfterPurchase) {
                    setError("Price After Purchase is required");
                    setCopiedLinkPrice(true); 
                    return;
                }
    
                const weiPrice = ethers.utils.parseEther(price);
                if (weiPrice.lte(0)) {
                    setError("Price must be greater than 0");
                    setCopiedLinkPrice(true); 
                    return;
                }

                const weiPriceAfterPurchase = ethers.utils.parseEther(
                    priceAfterPurchase);

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
//Change below link after test
            //Add Listing Modal "Your Art is being listed to sell. Please wait a few seconds for it to appear in your store."
          router.push(`/buy/${address}`);
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
    
                if (!inputPriceAfterPurchase) {
                    setError("Price After Purchase is required");
                    setCopiedLink(true); 
                    return;
                }
                if (inputPriceAfterPurchase == 0) {
                    setError("Price After Purchase is required");
                    setCopiedLink(true); 
                    return;
                }
    
                // Check if priceAfterPurchaseNum is less than formattedPrice
                if (inputPriceAfterPurchase < formattedPrice || inputPriceAfterPurchase < (2 * formattedPrice)) {
                    setError("Price After Purchase must be greater than or equal to the original price and less than twice the original price");
                    setCopiedLink(true); 
                    return; 
                }

                else {
                    // Ensure priceAfterPurchaseNum is a string before converting it to Wei
                    const etherPriceAfterPurchase = inputPriceAfterPurchase.toString();
                    // Convert the string to Wei
                    const weiInputPriceAfterPurchase = ethers.utils.parseEther(etherPriceAfterPurchase);
                    // Continue with the listing process...
                    await onSellConfirmedMinted(weiInputPriceAfterPurchase); // Ensure this is awaited
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

        {showCopiedLinkPrice && (
			<div id="copiedLink">

				<div className="modal-content">
				<p>Price Required</p>
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
                id="arells-loader-icon-asset" 
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
            {isNFTMinted ? (
                    <div>
                        <div id="asset-name-wrapper">
                            <h3 id="name-blue-orange">{meta?.name}</h3> 
                        </div>
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
                            <p id="PAP-blue-orange-before-blue-orange">{formatNumber(inputPriceAfterPurchase)}</p>
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
                                value={inputPriceAfterPurchase}
                                onChange={handlePriceAfterPurchaseChange}                          
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
                        <div id="asset-name-wrapper">
                            <h3 id="name-blue-orange">{meta?.name}</h3> 
                        </div>
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
