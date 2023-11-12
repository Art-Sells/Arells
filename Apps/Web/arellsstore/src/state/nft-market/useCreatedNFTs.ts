import { gql, useQuery } from "@apollo/client";
import { ethers } from "ethers";
import { NFT } from "./interfaces";
import { GetOwnedNfTsQuery, GetOwnedNfTsQueryVariables, Nft } from "./gqls/__generated__/graphql";
// Define your GraphQL query first
export const GET_OWNED_NFTS = gql`
    query GetOwnedNFTs($owner: Bytes!) {
        nfts(where: {to: $owner}) {
            id
            from
            to
            tokenURI
            price
        }
    }
`;

const useCreatedNFTs = (storeAddress: any) => {
    // Use the provided creatorAddress in the query
    const { data } = useQuery<GetOwnedNfTsQuery, GetOwnedNfTsQueryVariables>(
        GET_OWNED_NFTS, 
        { variables: { owner: storeAddress }, skip: !storeAddress }
    );

    const createdNFTs = data?.nfts.map(parseRawNFT);
    
    return { createdNFTs };
};

const parseRawNFT = (raw: Nft): NFT => {
    return {
        id: raw.id,
        storeAddress: raw.to,
        owner: raw.price === "0" ? raw.to : raw.from,
        price: ethers.utils.formatEther(raw.price),
        tokenURI: raw.tokenURI,
    };
};

export default useCreatedNFTs;
