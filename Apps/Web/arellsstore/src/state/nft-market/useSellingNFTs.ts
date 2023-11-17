"use client";

import { gql, useSuspenseQuery } from "@apollo/client";
import {parseRawNFT} from "./useCreatedNFTs";
import { NFT_MARKET_ADDRESS } from "../nft-market/config";
import { GetSellingNFTs, GetSellingNFTsVariables } from "./__generated__/GetSellingNFTs";

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

