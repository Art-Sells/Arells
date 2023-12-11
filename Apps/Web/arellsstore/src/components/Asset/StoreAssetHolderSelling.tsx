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
import styling from '../../app/css/modals/loading/loader.module.css';
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


    const [meta, setMeta] = useState<AssetStoreMetadata>();

// asset constants above


// Asset Changing function/s below 
  const lastFetchedURL = useRef(""); // Add a useRef to keep track of the last URL

  // Update the fetchMetadata useEffect
  useEffect(() => {
    const fetchMetadata = async () => {
      const metadataResponse = await fetch(nft.tokenURI);
      if (metadataResponse.status !== 200) {
        return;
      }

      const json = await metadataResponse.json();
      if (json.image !== lastFetchedURL.current) { // Check if the fetched URL is different
        lastFetchedURL.current = json.image; // Update the ref
        setMeta({
          name: json.name,
          imageURL: json.image,
        });
      }
    };

    if (nft.tokenURI) {
      fetchMetadata();
    }
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
          <div id="create-art-modal-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={50}
            height={50}
            id="buy-art-image" 
            src="/images/market/cash-register.png"/>  
          <p id="list-art-words">BUYING ART</p>
          <div className={styling.loader}></div>
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
            disabled={isBuying}
            onClick={buy}>
              BUY</button>
          </>
        )}
  {/* Above for users who are not owners of the Assets */}      


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
});

export default StoreAssetHolderSelling;

function showErrorToast() {
  throw new Error("Function not implemented.");
}
