import { CreationValues } from "../../components/test/Create/CreationForm";
import {Contract} from "ethers";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import NFT_MARKET from '../../../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import useSigner from "../signer";
import useCreatedNFTs from "./useCreatedNFTs";

const NFT_MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS as string;

const useNFTMarket = () => {
  const{signer, address} = useSigner();
 // console.log("Retrieved signer:", signer);
  const nftMarket = new Contract(
    NFT_MARKET_ADDRESS,
    NFT_MARKET.abi,
    signer
  );

  const createdNFTs = useCreatedNFTs(address);

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

  return {
    createNFT,
    getCreatorOrCollector,
    ...createdNFTs
  };
};

export default useNFTMarket;
