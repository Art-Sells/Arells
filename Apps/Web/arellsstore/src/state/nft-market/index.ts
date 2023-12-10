
import { CreationValues } from "../../components/Create/CreationForm";
import {BigNumber, Contract, ethers} from "ethers";
import {TransactionResponse} from "@ethersproject/abstract-provider";
import NFT_MARKET from '../../../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import useSigner from "../signer";
import {useCreatedNFTs} from "../nft-market/useCreatedNFTs";
import {useSellingNFTs} from "../nft-market/useSellingNFTs";
import {NFT_MARKET_ADDRESS} from "../nft-market/config"
import { useBuyNFTs } from "./useBuyNFTs";
import { NFT } from "./interfaces";
import router from "next/router";
import handler from "../../pages/api/nft-storage";


const useNFTMarket = (storeAddress: string | null) => {
  const{signer, address} = useSigner();
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
    if (!(values.image instanceof File)) {
      console.error('Provided image is not a file');
      return;
    }
    try {
      // Call the handler to upload the image to IPFS and get the URI
      const ipfsResponse = await handler(values.image, values.name);
      console.log ("ipfs Response: ", ipfsResponse);
  
      // Check if the response from the handler is successful and contains the necessary data
      if (ipfsResponse.status === 200 && ipfsResponse.data && ipfsResponse.data.IpfsHash) {
        const ipfsUri = `https://yellow-able-heron-877.mypinata.cloud/ipfs/${ipfsResponse.data.IpfsHash}`; // Construct the IPFS URI
        console.log ("ipfs Uri: ", ipfsUri);

        // Proceed with creating the NFT using the received IPFS URI
        const transaction: TransactionResponse = await nftMarket.createNFT(ipfsUri);
        console.log ("transaction : ", transaction);
        await transaction.wait();
        // Additional code for after successful NFT creation
      } else {
        // Handle the case where the IPFS upload is not successful
        console.error('Failed to upload file to IPFS');
      }
    } catch (e) {
      console.error('Exception while creating NFT:', e);
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

  const checkIfNFTMinted = async (tokenId: string) => {
    if (!signer) {
      console.error('Signer is not available');
      return false;
    }

    try {
      // Convert tokenId to a number since the smart contract expects a uint256
      const numericTokenId = BigNumber.from(tokenId);

      // Call the isNFTMinted function from the smart contract
      const minted = await nftMarket.isNFTMinted(numericTokenId);
      return minted;
    } catch (e) {
      console.error("Exception while checking if NFT is minted:", e);
      return false;
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

  const withdrawFunds = async () => {
    if (!signer) {
      console.error('Signer is not available');
      return;
    }

    try {
      const transaction: TransactionResponse = await nftMarket.withdrawFunds();
      await transaction.wait();
      console.log("Funds withdrawn successfully");
    } catch (e) {
      console.error("Exception while withdrawing funds:", e);
      throw e;
    }
  };

  return {
    createNFT,
    getCreatorOrCollector,
    listNFTCreator,
    listNFTCollector,
    buyNFT,
    checkIfNFTMinted,
    withdrawFunds,
    ...createdNFTs,
    ...sellingNFTs,
    ...buyNFTs
  };
};

export default useNFTMarket;
