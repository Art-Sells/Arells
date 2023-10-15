import { CreationValues } from "../../components/test/CreationPage/CreationForm";

const useNFTMarket = () => {
  const createNFT = async (values: CreationValues) => {
    try {
      const data = new FormData();
      data.append("name", values.name);
      data.append("image", values.image);

      // Logging the FormData content (for debugging)
      for (let pair of data.entries()) {
        console.log(pair[0] + ', ' + pair[1]); 
      }

      const response = await fetch("/api/nft-storage", {
        method: "POST",
        body: data,
      });

      // Log the entire response for debugging
      console.log("Full response:", response);

      if (response.ok) { // check if response's status is okay
        const json = await response.json();
        console.log("tokenURI: ", json.uri);
      } else {
        // Log error response
        const errorData = await response.text();
        console.error("Error from /api/nft-storage:", errorData);
      }

    } catch (e) {
      console.error("Exception while calling /api/nft-storage:", e);
      throw e; 
    }
  };

  return {
    createNFT
  };
};

export default useNFTMarket;
