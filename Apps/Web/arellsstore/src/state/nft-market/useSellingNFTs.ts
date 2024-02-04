"use client";

import { gql, useSuspenseQuery } from "@apollo/client";
import {parseRawNFT, parseRawSingleNFT} from "./useCreatedNFTs";
import { NFT_MARKET_ADDRESS } from "../nft-market/config";
import { GetSellingNFTs, GetSellingNFTsVariables } from "./__generated__/GetSellingNFTs";
import { GetSingleSellingNFT, GetSingleSellingNFTVariables } from "./__generated__/GetSingleSellingNFT";

export const useSellingNFTs = (storeAddress: any) => {
    // Use the provided creatorAddress in the query
    const { data } = useSuspenseQuery<GetSellingNFTs, GetSellingNFTsVariables>(
        GET_SELLING_NFTS, 
        { variables: { 
            owner: storeAddress,
            marketAddress: NFT_MARKET_ADDRESS 
        }, skip: !storeAddress }
    );

    const sellingNFTs = data?.nfts.map(parseRawNFT);
    
    return { sellingNFTs };
};

export const useSingleSellingNFT = (storeAddress: any, nftId: any) => {
    const { data } = useSuspenseQuery<GetSingleSellingNFT, GetSingleSellingNFTVariables>(
        GET_SINGLE_SELLING_NFT, 
        { variables: { 
            owner: storeAddress,
            marketAddress: NFT_MARKET_ADDRESS ,
            id: nftId
        }, skip: !storeAddress }
    );

    // Extract the first element from the array if it exists
    const nftSelling = data && data.nfts.length > 0 ? parseRawSingleNFT(data.nfts[0]) : null;

    return { nftSelling };
};

export const GET_SELLING_NFTS = gql`
    query GetSellingNFTs(
        $owner: String!, 
        $marketAddress: String!) {
        nfts(
            where: {
            to: $marketAddress, 
            from: $owner
            }
        ) {
            id
            from
            to
            tokenURI
            price
        }
    }
`;

export const GET_SINGLE_SELLING_NFT = gql`
    query GetSingleSellingNFT(
        $owner: String!, 
        $marketAddress: String!
        $id: String!) {
        nfts(
            where: {
            to: $marketAddress, 
            from: $owner,
            id: $id
            }
        ) {
            id
            from
            to
            tokenURI
            price
        }
    }
`;

