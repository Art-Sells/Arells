import React from 'react';
import { useRouter } from 'next/router';
import AssetTest from '../../../../components/test/Asset/Asset';

const AssetPageTest = () => {
  const router = useRouter();
  const { id, to } = router.query;

  // Normally, you would fetch your data here using useEffect and then set it to state,
  // but since we are not using useEffect, we'll need to make sure that
  // the data is fetched elsewhere and passed in as props or context, or handled
  // synchronously here, which is not typical for data fetching.
  
  // Placeholder values for matchedNFT
  const matchedNFT = {
    owner: to, // This is a guess based on your previous code; you'll need to get the actual owner
    id: id,    // This is the NFT id from the URL
  };

  // It's important to consider that on the initial render, `router.query` might be empty,
  // because useRouter does not guarantee the availability of the query on the first render.
  // This means you may need to handle the case where `id` or `to` is undefined.

  return (
    <div id="asset-wrapper">
      {/* Make sure to handle the case when `id` or `to` is not available */}
      {id && to ? (
        <AssetTest ownerId={matchedNFT.owner} nftId={matchedNFT.id} />
      ) : (
        <div>Loading...</div> // You may need a loading state or some fallback UI here.
      )}
    </div>
  );
};

export default AssetPageTest;



