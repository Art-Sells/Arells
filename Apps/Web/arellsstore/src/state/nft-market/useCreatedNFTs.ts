// import { gql, useQuery } from "@apollo/client";
// import useSigner from "../signer";
// import { GetCreatedNFTs, GetCreatedNFTsVariables } from "./__generated__/GetCreatedNFTs";
// const useCreatedNFTs = () => {
//     const {address} = useSigner();
//     const {data} = useQuery<GetCreatedNFTs, GetCreatedNFTsVariables>(
//         GET_CREATED_NFTS, 
//         {variables: {creator: address ?? ""}, skip: !address}
//     );

//     const createdNFTs = data?.nfts

//     return {createdNFTs};
// };

// const GET_CREATED_NFTS = gql`
//     query GetCreatedNFTs($creator: String!) {
//         nfts(where: {to: $creator}) {
//             id
//             from
//             to
//             tokenURI
//             price
//         }
//     }
// `;

// export default useCreatedNFTs;