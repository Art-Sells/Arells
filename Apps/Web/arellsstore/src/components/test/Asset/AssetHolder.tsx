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

import { SetStateAction, useEffect, useMemo, useState } from 'react';
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


//Price & Price Affter Purchase Systems Below
    const [price, setPrice] = useState("");
    const {listNFTCreator} = useNFTMarket(storeAddressFromURL);
    const [error, setError] = useState<string>();
    const onSellConfirmed = async (price: BigNumber) => {
        try {
          await listNFTCreator(nft.id, price);
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
    
                const wei = ethers.utils.parseEther(price);
                if (wei.lte(0)) {
                    setError("Price must be greater than 0");
                    return;
                }
    
                await onSellConfirmed(wei); // Ensure this is awaited
            }
        } catch (e) {
            console.error("Error in listing NFT:", e);
            // Handle the error appropriately (e.g., set an error state, show a message, etc.)
        }
    }
    
//Price & Price Affter Purchase Systems Above



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
            <h3 id="name-blue-orange">{meta?.name}</h3> 
            <div id="blue-orange-prices-before-seller-created">
                <p id="PAP-seller-created">Price After Purchase</p>
                <p id="PAP-blue-orange-before-seller-created">{nft.price}</p>
                <hr id="priceline-seller-created" />
                <p id="yourprice-seller-created">Price</p>
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
    </>
  );
};

export default AssetHolder;

function showErrorToast() {
    throw new Error("Function not implemented.");
}
