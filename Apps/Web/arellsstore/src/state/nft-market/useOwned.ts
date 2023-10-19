import { gql } from "@apollo/client";

const GET_CREATED_NFTS = gql`
    query GetCreatedNFTs($creator: String!) {
        nfts(where: {to: $creator}) {
            id
            from
            to
            tokenURI
            price
        }
    }
`;