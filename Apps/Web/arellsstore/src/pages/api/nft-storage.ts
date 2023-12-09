import axios from 'axios';

const JWT = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY as string;

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
    if (axios.isAxiosError(error)) {
      // Axios-specific error
      console.error('Axios error:', error.message);
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
    } else {
      // Non-Axios error
      console.error('Unexpected error:', error);
    }
    throw error; // Rethrow the error to be handled by the caller
  }
};

export default handler;
