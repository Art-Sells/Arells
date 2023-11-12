"use client";

import { gql, useSuspenseQuery } from "@apollo/client";
import { ethers } from "ethers";
import { NFT } from "./interfaces";
import { GetCreatedNFTs, GetCreatedNFTsVariables, GetCreatedNFTs_nfts } from "./__generated__/GetCreatedNFTs";

// Define your GraphQL query first
export const GET_CREATED_NFTS = gql`
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

const useCreatedNFTs = (storeAddress: any) => {
    // Use the provided creatorAddress in the query
    const { data } = useSuspenseQuery<GetCreatedNFTs, GetCreatedNFTsVariables>(
        GET_CREATED_NFTS, 
        { variables: { creator: storeAddress }, skip: !storeAddress }
    );

    const createdNFTs = data?.nfts.map(parseRawNFT);
    
    return { createdNFTs };
};

const parseRawNFT = (raw: GetCreatedNFTs_nfts): NFT => {
    return {
        id: raw.id,
        storeAddress: raw.to,
        owner: raw.price === "0" ? raw.to : raw.from,
        price: ethers.utils.formatEther(raw.price),
        tokenURI: raw.tokenURI,
    };
};

export default useCreatedNFTs;
