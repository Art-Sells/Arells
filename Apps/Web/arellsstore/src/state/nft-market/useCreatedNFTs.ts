"use client";

import { gql, useSuspenseQuery } from "@apollo/client";
import { ethers } from "ethers";
import { NFT } from "./interfaces";
import { 
    GetCreatedNFTs, 
    GetCreatedNFTsVariables, 
    GetCreatedNFTs_nfts,
} from "./__generated__/GetCreatedNFTs";
import { 
    GetSingleNFT, 
    GetSingleNFTVariables, 
    GetSingleNFT_nfts,
} from "./__generated__/GetSingleNFT";

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

export const GET_SINGLE_NFT = gql`
    query GetSingleNFT($creator: String!, $id: String!) {
        nfts(where:{to: $creator, id: $id}) {
            id
            from
            to
            tokenURI
            price
        }
    }
`;


export const useCreatedNFTs = (storeAddress: any) => {
    // Use the provided creatorAddress in the query
    const { data } = useSuspenseQuery<GetCreatedNFTs, GetCreatedNFTsVariables>(
        GET_CREATED_NFTS, 
        { variables: { creator: storeAddress }, skip: !storeAddress }
    );

    const createdNFTs = data?.nfts.map(parseRawNFT);
    
    return { createdNFTs };
};

export const parseRawNFT = (raw: GetCreatedNFTs_nfts): NFT => {
    
    return {
        id: raw.id,
        storeAddress: raw.to,
        owner: raw.price === "0" ? raw.to : raw.from,
        price: raw.price === "0" ? "0" : ethers.utils.formatEther(raw.price),
        tokenURI: raw.tokenURI,
    };
};

export const useSingleNFT = (storeAddress: any, nftId: any) => {
    const { data } = useSuspenseQuery<GetSingleNFT, GetSingleNFTVariables>(
        GET_SINGLE_NFT, 
        { variables: { creator: storeAddress, id: nftId }, skip: !storeAddress || !nftId }
    );

    // Extract the first element from the array if it exists
    const nft = data && data.nfts.length > 0 ? parseRawSingleNFT(data.nfts[0]) : null;

    return { nft };
};

export const parseRawSingleNFT = (raw: GetSingleNFT_nfts): NFT => {
    return {
        id: raw.id,
        storeAddress: raw.to,
        owner: raw.price === "0" ? raw.to : raw.from,
        price: raw.price === "0" ? "0" : ethers.utils.formatEther(raw.price),
        tokenURI: raw.tokenURI,
    };
};
