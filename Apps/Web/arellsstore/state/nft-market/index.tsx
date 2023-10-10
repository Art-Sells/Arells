import { Contract, Signer } from "ethers";
import useSigner from "../signer";

// Assuming that the ABI is properly exported from the JSON
import NFT_MARKET from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

const NFT_MARKET_ADDRESS: string = String(process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS);

type CreateNFTValues = {
  name: string;
  image: string;
}

const useNFTMarket = () => {
  const { signer } = useSigner();
  const nftMarket = new Contract(
    NFT_MARKET_ADDRESS, 
    NFT_MARKET.abi,
    signer as Signer
  );

  const createNFT = async (values: CreateNFTValues) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("image", values.image);
      
      const response = await fetch("/api/nft-storage", {
        method: "POST",
        body: formData,
      });
      
      if (response.status === 201) {
        const json = await response.json();
        const transaction = await nftMarket.createNFT(json.uri);
        await transaction.wait();
      }

    } catch (e) {
      console.error(e);
      throw e;  // Throw the error to be handled by the calling function.
    }
  };

  return {
    createNFT,
  };
};

export default useNFTMarket;
