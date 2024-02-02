/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSingleNFT
// ====================================================

export interface GetSingleNFT_nfts {
  __typename: "NFT";
  id: string;
  from: any;
  to: any;
  tokenURI: string;
  price: any;
}

export interface GetSingleNFT {
  nfts: GetSingleNFT_nfts[];
}

export interface GetSingleNFTVariables {
  creator: string;
  id: string;
}
