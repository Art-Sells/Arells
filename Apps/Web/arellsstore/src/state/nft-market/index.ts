import { CreationValues } from "../../components/test/Create/CreationForm";
import {BigNumber, Contract, ethers} from "ethers";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import NFT_MARKET from '../../../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import useSigner from "../signer";
import {useCreatedNFTs} from "../nft-market/useCreatedNFTs";
import {useSellingNFTs} from "../nft-market/useSellingNFTs";
import {NFT_MARKET_ADDRESS} from "../nft-market/config"
import { useBuyNFTs } from "./useBuyNFTs";
import { NFT } from "./interfaces";


const useNFTMarket = (storeAddress: string | null) => {
  const{signer} = useSigner();
 // console.log("Retrieved signer:", signer);
  const nftMarket = new Contract(
    NFT_MARKET_ADDRESS,
    NFT_MARKET.abi,
    signer
  );

  const createdNFTs = useCreatedNFTs(storeAddress);
  const sellingNFTs = useSellingNFTs(storeAddress);
  const buyNFTs = useBuyNFTs(storeAddress);

  const createNFT = async (values: CreationValues) => {
    try {
      const data = new FormData();
      data.append("name", values.name);
      data.append("image", values.image);
      const response = await fetch("/api/nft-storage", {
        method: "POST",
        body: data,
      });
      if (response.status == 201) { // check if response's status is okay
        const json = await response.json();
        const transaction: TransactionResponse = await nftMarket.createNFT(
          json.uri
        );
        await transaction.wait();
      } 
    } catch (e) {
      console.error("Exception while calling /api/nft-storage:", e);
      throw e; 
    }
  };

  const getCreatorOrCollector = async (tokenId: string) => {
    if (!signer) {
      console.error('Signer is not available');
      return;
    }
    
    try {
      // Assuming your contract has a function `getNFTCreatorOrCollector` that takes a tokenId
      const [address, isCollector] = await nftMarket.getNFTCreatorOrCollector(tokenId);
      return { address, isCollector };
    } catch (e) {
      console.error("Exception while getting creator or collector:", e);
      throw e;
    }
  };

  const listNFTCreator = async (
    tokenID: string, 
    price: BigNumber,
    priceAfterPurchase: BigNumber) => {
    const transaction: TransactionResponse = await nftMarket.listNFTCreator (
      tokenID,
      price,
      priceAfterPurchase
    );
    await transaction.wait();
  }

  const listNFTCollector = async (
    tokenID: string, 
    newPriceAfterPurchase: BigNumber) => {
    const transaction: TransactionResponse = await nftMarket.listNFTCollector (
      tokenID,
      newPriceAfterPurchase
    );
    await transaction.wait();
  }

  const buyNFT = async (nft: NFT) => {
    const transaction: TransactionResponse = await nftMarket.buyNFT (
      nft.id,
      {value: ethers.utils.parseEther(nft.price)}
    );
    await transaction.wait();
  }

  return {
    createNFT,
    getCreatorOrCollector,
    listNFTCreator,
    listNFTCollector,
    buyNFT,
    ...createdNFTs,
    ...sellingNFTs,
    ...buyNFTs
  };
};

export default useNFTMarket;
