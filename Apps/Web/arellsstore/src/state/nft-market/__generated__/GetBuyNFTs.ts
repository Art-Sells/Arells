/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetBuyNFTs
// ====================================================

export interface GetBuyNFTs_nfts {
  __typename: "NFT";
  id: string;
  from: any;
  to: any;
  tokenURI: string;
  price: any;
}

export interface GetBuyNFTs {
  nfts: GetBuyNFTs_nfts[];
}

export interface GetBuyNFTsVariables {
  currentAddress: string;
  marketAddress: string;
}
