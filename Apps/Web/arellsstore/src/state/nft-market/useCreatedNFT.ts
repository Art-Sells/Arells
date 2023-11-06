import { gql, useQuery } from "@apollo/client";
import { ethers } from "ethers";
import useSigner from "../signer";
import { NFT } from "./interfaces";
import { GetCreatedNFTs, GetCreatedNFTsVariables, GetCreatedNFTs_nfts } from "./__generated__/GetCreatedNFTs";

// Define your GraphQL query first
const GET_CREATED_NFTS = gql`
    query GetCreatedNFTs($creator: String!) {
        nfts(where: {to: $creator}) {
            id
            from
            to
            tokenURI
            price
        }
    }
`;

const useCreatedNFT = (ownerId: string) => {

    const { data, loading, error } = useQuery<GetCreatedNFTs, GetCreatedNFTsVariables>(
        GET_CREATED_NFTS, 
        { variables: { creator: ownerId }, skip: !ownerId }
    );

    if (error) {
        console.error('Error fetching created NFTs:', error);
    }

    const createdNFT = data?.nfts.map(parseRawNFT);
    return { createdNFT, loading, error };
};

const parseRawNFT = (raw: GetCreatedNFTs_nfts): NFT => {
    return {
        id: raw.id,
        owner: raw.price === "0" ? raw.to : raw.from,
        price: ethers.utils.formatEther(raw.price),
        tokenURI: raw.tokenURI,
    };
};

export default useCreatedNFT;
