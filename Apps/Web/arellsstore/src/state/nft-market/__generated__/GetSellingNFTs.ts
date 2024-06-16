/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSellingNFTs
// ====================================================

export interface GetSellingNFTs_nfts {
  __typename: "NFT";
  id: string;
  from: any;
  to: any;
  tokenURI: string;
  price: any;
}

export interface GetSellingNFTs {
  nfts: GetSellingNFTs_nfts[];
}

export interface GetSellingNFTsVariables {
  owner: string;
  marketAddress: string;
}
