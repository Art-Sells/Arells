import axios, { AxiosResponse } from 'axios';

const JWT = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY as string;

async function uploadToIPFS(fileBlob: Blob, metadata?: { name: string }): Promise<AxiosResponse<any>> {
  const formData = new FormData();
  formData.append('file', fileBlob);

  if (metadata) {
    const pinataMetadata = JSON.stringify(metadata);
    formData.append('pinataMetadata', pinataMetadata);
  }

  try {
    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        'Authorization': `Bearer ${JWT}`
      }
    });
    return response; // Return the Axios response
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
}

const handler = async (file: File, fileName: string): Promise<string> => {
  // Upload the image file
  const imageResponse = await uploadToIPFS(file, { name: fileName });
  if (imageResponse.status !== 200) throw new Error('Failed to upload image');
  const imageUrl = `https://yellow-able-heron-877.mypinata.cloud/ipfs/${imageResponse.data.IpfsHash}`;

  // Create and upload metadata
  const metadata = {
    name: fileName,
    image: imageUrl
    // Add other metadata properties if needed
  };
  const metadataResponse = await uploadToIPFS(new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  if (metadataResponse.status !== 200) throw new Error('Failed to upload metadata');
  const metadataUri = `https://yellow-able-heron-877.mypinata.cloud/ipfs/${metadataResponse.data.IpfsHash}`;

  return metadataUri; // Return the URI of the uploaded metadata
};

export default handler;

