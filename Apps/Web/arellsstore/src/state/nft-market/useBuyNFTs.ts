"use client";

import { gql, useSuspenseQuery } from "@apollo/client";
import {parseRawNFT} from "./useCreatedNFTs";
import { NFT_MARKET_ADDRESS } from "./config";
import { GetBuyNFTs, GetBuyNFTsVariables } from "./__generated__/GetBuyNFTs";

export const useBuyNFTs = (address: any) => {
    // Use the provided creatorAddress in the query
    const { data } = useSuspenseQuery<GetBuyNFTs, GetBuyNFTsVariables>(
        GET_BUY_NFTS, 
        { variables: { 
            currentAddress: address,
            marketAddress: NFT_MARKET_ADDRESS 
        }, skip: !address }
    );

    const buyNFTs = data?.nfts.map(parseRawNFT);
    
    return { buyNFTs };
};

export const GET_BUY_NFTS = gql`
    query GetBuyNFTs(
        $currentAddress: String!, 
        $marketAddress: String!) {
        nfts(
            where: {
            to: $marketAddress, 
            from_not: $currentAddress
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

