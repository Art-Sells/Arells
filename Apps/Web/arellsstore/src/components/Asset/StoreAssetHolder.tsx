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

const StoreAssetHolder = (props: AssetStoreProps) => {
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

  console.log("NFT token URI: ", nft.tokenURI);

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
    console.log("PAP Sets: ", priceAfterPurchaseSets);
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

  return (
    <>

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
                      <p id="PAP-seller-created">Price After Purchase</p>
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
                      {formattedPrice}
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
                      <p id="PAP-seller-created">Price After Purchase</p>
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
                      <p id="PAP-seller-created">Price After Purchase</p>
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
                        {formattedPrice}
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
{/* change below link after test */}                      
                <Link legacyBehavior href={`/buy/${storeAddressFromURL}`} passHref>
                  <button id="blue-orange-add-to-cart-seller-created-selling" >
                    SELLING</button>
                </Link>
              </>
            )}	
      {/* for sale functions above  */}    


{/* Above for users who are not owners of the Assets */}     










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
                        <p id="PAP-seller-created">Price After Purchase</p>
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
                      <p id="PAP-seller-created">Price After Purchase</p>
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
                        {formattedPrice}
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
                      <p id="PAP-seller-created">Price After Purchase</p>
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
                            {formattedNewPriceAfterPurchase}
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
                        {formattedPrice}
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
  );
};

export default StoreAssetHolder;
