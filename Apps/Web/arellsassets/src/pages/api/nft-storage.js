import formidable from "formidable";
import { readFileSync, unlinkSync } from "fs";
import { File, NFTStorage } from "nft.storage";
import { tmpdir } from "os";

const client = new NFTStorage({ token: process.env.NFT_STORAGE_KEY });

const DEFAULT_DESCRIPTION = "Arells Digital Asset";  // Set the default description here

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method not allowed. Use POST` });
  }

  try {
    // Parse the request body and save image in /tmp directory
    const data = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: true, uploadDir: tmpdir() });
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    console.log('Parsed data:', data);

    // Ensure `name` and `image` are provided in the request
    if (!data.fields.name || !data.files.image) {
      return res.status(400).json({ error: 'Name or image file missing' });
    }

    // Extract name as a string from the parsed data fields
    const name = Array.isArray(data.fields.name) ? data.fields.name[0] : data.fields.name;
    if (!name || typeof name !== 'string') {
      throw new Error('The name property is missing or not of type string.');
    }

    // Extract description from the parsed data fields or set the default description
    let description = Array.isArray(data.fields.description) ? data.fields.description[0] : data.fields.description;
    if (!description || typeof description !== 'string') {
      description = DEFAULT_DESCRIPTION;
    }

    // Extract the PersistentFile instance
    const imageFile = data.files.image[0];

    // Destructure properties from the PersistentFile instance
    const {
      filepath,
      originalFilename = "image",
      mimetype = "image/jpeg",
    } = imageFile;

    const buffer = readFileSync(filepath);
    const arraybuffer = Uint8Array.from(buffer).buffer;
    const file = new File([arraybuffer], originalFilename, {
      type: mimetype,
    });

    // Upload data to nft.storage
    const metadata = await client.store({
      name: name,  // Use the extracted string name here
      description: description,  // Use the provided or default description here
      image: file,
    });

    // Delete the temporary image file
    unlinkSync(filepath);

    // Return tokenURI
    res.status(201).json({ uri: metadata.url });

  } catch (e) {
    console.error("Error in nft-storage:", e);
    return res.status(400).json({ error: e.message });
  }
};

// Disabling bodyParser since we're using formidable to parse the request
export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
