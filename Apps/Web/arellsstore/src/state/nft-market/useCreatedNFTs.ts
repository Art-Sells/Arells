import { gql, useQuery } from "@apollo/client";
import {ethers} from "ethers";
import useSigner from "../signer";
import {NFT} from "./interfaces";
import { GetCreatedNFTs, GetCreatedNFTsVariables, GetCreatedNFTs_nfts } from "./__generated__/GetCreatedNFTs";

const useCreatedNFTs = () => {
    const {address} = useSigner();

    const {data} = useQuery<GetCreatedNFTs, GetCreatedNFTsVariables>(
        GET_CREATED_NFTS, 
        {variables: {creator: address ?? ""}, skip: !address}
    );

    const createdNFTs = data?.nfts.map(parseRawNFT);

    return {createdNFTs};
};

const parseRawNFT = (raw: GetCreatedNFTs_nfts): NFT => {
    return {
        id: raw.id,
        owner: raw.price == "0" ? raw.to : raw.from,
        price: ethers.utils.formatEther(raw.price),
        tokenURI: raw.tokenURI,
    };
};

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

export default useCreatedNFTs;