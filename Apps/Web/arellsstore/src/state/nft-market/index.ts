import { CreationValues } from "../../components/test/CreationPage/CreationForm";
import {Contract} from "ethers";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import NFT_MARKET from '../../../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import useSigner from "../signer";
// import useCreatedNFTs from "./useCreatedNFTs";

const NFT_MARKET_ADDRESS = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS as string;

const useNFTMarket = () => {
  const{signer} = useSigner();
 // console.log("Retrieved signer:", signer);
  const nftMarket = new Contract(
    NFT_MARKET_ADDRESS,
    NFT_MARKET.abi,
    signer
  );

  // const createdNFTs = useCreatedNFTs();

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

  return {
    createNFT,
    // createdNFTs
  };
};

export default useNFTMarket;
