import formidable from "formidable";
import { readFileSync, unlinkSync } from "fs";
import { NextApiHandler } from "next";
import { File, NFTStorage } from "nft.storage";
import { tmpdir } from "os";

const DEFAULT_DESCRIPTION = "Arells Digital Asset";

const client = new NFTStorage({ token: `${process.env.NFT_STORAGE_KEY}` });

const handler: NextApiHandler = async (req, res) => {
  if (req.method != "POST") {
    return res.status(403).json({ error: `Unsupported method ${req.method}` });
  }
  try {
    // Parse req body and save image in /tmp
    const data: any = await new Promise((res, rej) => {
      const form = formidable({ multiples: true, uploadDir: tmpdir() });
      form.parse(req, (err, fields, files) => {
        if (err) rej(err);
        res({ ...fields, ...files });
      });
    });
    // Read image from /tmp
    const {
      filepath,
      originalFilename = "image",
      mimetype = "image",
    } = data.image;
    const buffer = readFileSync(filepath);
    const arraybuffer = Uint8Array.from(buffer).buffer;
    const file = new File([arraybuffer], originalFilename, {
      type: mimetype,
    });
    // Upload data to nft.storage
    const metadata = await client.store({
      name: data.name,
      description: data.description || DEFAULT_DESCRIPTION,
      image: file,
    });
    // Delete tmp image
    unlinkSync(filepath);
    // return tokenURI
    res.status(201).json({ uri: metadata.url });
  } catch (e) {
    console.error("Error in /api/nft-storage:", e);
 
    if (e instanceof Error) {
        // Handle known Error types
        return res.status(400).json({ error: e.message });
    } else {
        // Handle any other type of error (string, number, etc.)
        return res.status(400).json({ error: 'Unknown error' });
    }
 }
 
};

// Must disable bodyParser for formidable to work
export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;