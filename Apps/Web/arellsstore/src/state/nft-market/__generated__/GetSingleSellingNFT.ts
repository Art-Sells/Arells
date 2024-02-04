/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSingleSellingNFT
// ====================================================

export interface GetSingleSellingNFT_nfts {
  __typename: "NFT";
  id: string;
  from: any;
  to: any;
  tokenURI: string;
  price: any;
}

export interface GetSingleSellingNFT {
  nfts: GetSingleSellingNFT_nfts[];
}

export interface GetSingleSellingNFTVariables {
  owner: string;
  marketAddress: string;
  id: string;
}
