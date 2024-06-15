/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetCreatedNFTs
// ====================================================

export interface GetCreatedNFTs_nfts {
  __typename: "NFT";
  id: string;
  from: any;
  to: any;
  tokenURI: string;
  price: any;
}

export interface GetCreatedNFTs {
  nfts: GetCreatedNFTs_nfts[];
}

export interface GetCreatedNFTsVariables {
  creator: string;
}
