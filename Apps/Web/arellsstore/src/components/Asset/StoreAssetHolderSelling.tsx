'use client'

// asset components (change below links after test)
import useSigner from "../../state/signer";
import { ipfsToHTTPS } from "../../helpers";
import { NFT } from "../../state/nft-market/interfaces"

// Change below link after test
import '../../app/css/prototype/seller-created.css';
import '../../app/css/prototype/buyer-collected.css';

//Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';
import "../../app/css/modals/copiedlink.css";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from "next/router";
import { ethers } from "ethers";
import useNFTMarket from "../../state/nft-market";
import { toast } from "react-toastify";
import { usePriceAfterPurchaseSets } from "../../state/nft-market/usePriceAfterPurchaseSets";

type AssetStoreMetadata = {
    name: string;
    imageURL: string;
};

type AssetStoreProps = {
    nft: NFT;
};

const StoreAssetHolderSelling = (props: AssetStoreProps) => {
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
    console.log("NFT info: ", nft);
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
    const forSaleMinted = formattedNewPriceAfterPurchase != "...";

    const [isLoadingNewPrice, setIsLoadingNewPrice] = useState(true);
    useEffect(() => {
        if (priceAfterPurchaseSets?.length > 0) {
            const newPAP = priceAfterPurchaseSets[0].newPriceAfterPurchase;
            setFormattedNewPriceAfterPurchase(newPAP !== "0" ? newPAP : "...");
            setIsLoadingNewPrice(false); // Data is now ready, set loading to false
        }
    }, [priceAfterPurchaseSets]);
  
// Asset Changing function/s above 

//Buying functions Below
  const {buyNFT} = useNFTMarket(address ?? null);
  const [error, setError] = useState<string>();
  const onBuyClicked = async () => {
      try {
        await buyNFT(nft);
        toast.success("You bought this NFT. Changes will be reflected shortly.");
//Change below link after test
        //Add Truck Modal "Congratulations on your purchase! Your Art is being delivered, please wait a few seconds for it to appear in your store."
        router.push(`/own/${address}`);
      } catch (e) {
        showErrorToast();
        console.error(e);
      }
    };
    
  async function buy() {
      try {
          if (!address) {
              await connectWallet(); 
              return; 
          }
          if (address) {
              setError(""); 
              await onBuyClicked(); 
          }
      } catch (e) {
          console.error("Error in buying NFT:", e);
      }
  }
//Buying Functions Above

//Modal Functions below
  const [shareToSellModal, setShareToSellModal] = useState(false);
  const closeShareToSellModal = () => {
    setShareToSellModal(false);
  };
  function shareToSell() {
    setShareToSellModal(true);
  };
//Modal Functions Above

  return (
    <>
      {/*<!-- Modals below link after test -->*/}

      {shareToSellModal && (
        <div id="copiedLink">
          <div className="modal-content">
          <p>SHARE TO SELL</p>
          <button className="close"
            onClick={closeShareToSellModal}>OK</button>	
          </div>
        </div>	
      )}      


      {/*<!-- Modals Above -->*/}

      <div id="blue-orange-seller-created">
        {/*  Change below link after test  */}
        {meta && (
          <Image
            loader={imageLoader}
            alt=""
            width={200}  
            height={200}  
            id="photo-asset-owned" 
            src={meta?.imageURL}
          />
        )}	
{/* Below for users who are not owners of the Assets */} 
        {!addressMatch && !address && forSale && !isNFTMinted && (
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
              <p id="PAP-blue-orange-before-seller-created">
              <Image
                loader={imageLoader}
                alt=""
                width={18}  
                height={16}  
                id="polygon-logo-pap" 
                src="/images/market/polygon.png"
              />
                {formattedPriceAfterPurchase}
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
                {formattedPrice}
              </p>
            </div>         
            <button id="blue-orange-add-to-cart-seller-created" 
            // change below function after test
            onClick={buy}>
              BUY</button>
          </>
        )}
        {!addressMatch && !address && forSale && isNFTMinted && (
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
              <p id="PAP-blue-orange-before-seller-created">
              <Image
                loader={imageLoader}
                alt=""
                width={18}  
                height={16}  
                id="polygon-logo-pap" 
                src="/images/market/polygon.png"
              />
                {formattedNewPriceAfterPurchase}
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
                {formattedPrice}
              </p>
            </div>         
            <button id="blue-orange-add-to-cart-seller-created" 
            // change below function after test
            onClick={buy}>
              BUY</button>
          </>
        )}
        {!addressMatch && address && forSale && !isNFTMinted && (
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
              <p id="PAP-blue-orange-before-seller-created">
              <Image
                loader={imageLoader}
                alt=""
                width={18}  
                height={16}  
                id="polygon-logo-pap" 
                src="/images/market/polygon.png"
              />
                {formattedPriceAfterPurchase}
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
                {formattedPrice}
              </p>
            </div>         
            <button id="blue-orange-add-to-cart-seller-created" 
            // change below function after test
            onClick={buy}>
              BUY</button>
          </>
        )}
        {!addressMatch && address && forSale && isNFTMinted && (
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
              <p id="PAP-blue-orange-before-seller-created">
              <Image
                loader={imageLoader}
                alt=""
                width={18}  
                height={16}  
                id="polygon-logo-pap" 
                src="/images/market/polygon.png"
              />
                {formattedNewPriceAfterPurchase}
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
                {formattedPrice}
              </p>
            </div>         
            <button id="blue-orange-add-to-cart-seller-created" 
            // change below function after test
            onClick={buy}>
              BUY</button>
          </>
        )}
  {/* Above for users who are not owners of the Assets */}      


{/* Below for owners of the Assets */}	
        {addressMatch && address && forSale && !isNFTMinted && (
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
              <p id="PAP-blue-orange-before-seller-created">
              <Image
                  loader={imageLoader}
                  alt=""
                  width={18}  
                  height={16}  
                  id="polygon-logo-pap" 
                  src="/images/market/polygon.png"
                />
                {formattedPriceAfterPurchase}
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
                {formattedPrice}
              </p>
            </div>         
            <button id="blue-orange-add-to-cart-seller-created" 
            // change below function after test
            onClick={shareToSell}>
              BUY</button>
          </>
        )}
        {addressMatch && address && forSale && isNFTMinted && (
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
                  <p id="PAP-blue-orange-before-seller-created">
                  <Image
                        loader={imageLoader}
                        alt=""
                        width={18}  
                        height={16}  
                        id="polygon-logo-pap" 
                        src="/images/market/polygon.png"
                      />
                    {formattedNewPriceAfterPurchase}
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
                    {formattedPrice}
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
    </>
  );
};

export default StoreAssetHolderSelling;

function showErrorToast() {
  throw new Error("Function not implemented.");
}
