"use client";

import { gql, useSuspenseQuery } from "@apollo/client";
import { 
    GetPriceAfterPurchaseSets, 
    GetPriceAfterPurchaseSetsVariables,
    GetPriceAfterPurchaseSets_priceAfterPurchaseSets
 } from "./__generated__/GetPriceAfterPurchaseSets";
import { NFT } from "./interfaces";
import { ethers } from "ethers";

export const usePriceAfterPurchaseSets = (id: any) => {
    // Use the provided creatorAddress in the query
    const { data } = useSuspenseQuery<GetPriceAfterPurchaseSets, GetPriceAfterPurchaseSetsVariables>(
        GET_PRICE_AFTER_PURCHASE_SETS, 
        { variables: { 
            id: id
        }, skip: !id }
    );

    const priceAfterPurchaseSets = data?.priceAfterPurchaseSets.map(
        parseRawPriceAfterPurchaseSet);
    
    return { priceAfterPurchaseSets };
};

export const parseRawPriceAfterPurchaseSet = (raw: GetPriceAfterPurchaseSets_priceAfterPurchaseSets) => {
    
    return {
        id: raw.id,
        newPriceAfterPurchase: raw.newPriceAfterPurchase === "0" ? "0" : ethers.utils.formatEther(raw.newPriceAfterPurchase),
    };
};

export const GET_PRICE_AFTER_PURCHASE_SETS = gql`
    query GetPriceAfterPurchaseSets($id: String!) {
        priceAfterPurchaseSets(where: {id: $id}) {
            id
            newPriceAfterPurchase
        }
    }
`;

