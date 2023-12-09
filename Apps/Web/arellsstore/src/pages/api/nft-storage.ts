// Assuming this function is now a regular function and not a Next.js API route handler
import axios from 'axios';

const JWT: string = process.env.NFT_STORAGE_KEY || "Your_Fallback_Token";

const handler = async (file: File, fileName: string) => {
  const formData = new FormData();
  formData.append('file', file);

  const pinataMetadata = JSON.stringify({ name: fileName });
  formData.append('pinataMetadata', pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 0 });
  formData.append('pinataOptions', pinataOptions);

  try {
    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        'Authorization': `Bearer ${JWT}`
      }
    });

    return response; // Return the Axios response
  } catch (error) {
    console.error(error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

export default handler;
