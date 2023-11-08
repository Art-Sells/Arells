import React from 'react';
import { useQuery } from "@apollo/client";
import AssetTest from '../../../../components/test/Asset/Asset';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { GET_CREATED_NFTS } from '../../../../state/nft-market/useCreatedNFTs';

type AssetPageTestProps = {
  ownerId: string;
  nftId: string;
};

const AssetPageTest: React.FC<AssetPageTestProps> = ({ ownerId, nftId }) => {
  // Use the useQuery hook to fetch the NFT data on the client
  const { loading, error, data } = useQuery(GET_CREATED_NFTS, {
    variables: { creator: ownerId },
    skip: typeof window === 'undefined', // skip the query on the server
  });

  // Find the specific NFT by ID if data is available
  const nftData = data?.nfts.find((nft: { id: any; }) => String(nft.id) === String(nftId));

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Use nftData here or pass it to the AssetTest component if needed
  // Assuming AssetTest is updated to not require nftData as a prop, since it's not included in the original problem statement
  
  return (
    <div id="asset-wrapper">
      <AssetTest ownerId={ownerId} nftId={nftId} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  // Correctly type params
  const params = context.params as { ownerId: string; nftId: string } | undefined;

  if (!params) {
    // Return notFound or redirect as necessary
    return {
      notFound: true,
    };
  }

  const { ownerId, nftId } = params;

  // No NFT data is fetched here, only IDs are passed to the component
  return {
    props: {
      ownerId,
      nftId,
    },
  };
};

export default AssetPageTest;
