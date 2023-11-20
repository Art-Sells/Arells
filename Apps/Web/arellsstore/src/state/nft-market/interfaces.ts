export type NFT = {
    id: string;
    // Owner of NFT, if NFT is listed for sale, this will be the seller address
    owner: string;
    storeAddress: any;
    // If price > 0, the NFT is for sale
    price: string;
    tokenURI: string;
  };

  export type PriceAfterPurchaseSet = {
    id: string;
    newPriceAfterPurchase: string;
  };