import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  // Your AWS configuration
  region: 'your-region',
  credentials: {
    accessKeyId: process.env.API_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.API_SECRET_ACCESS_KEY as string,
  },
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeAddress } = req.query;

  if (!storeAddress || typeof storeAddress !== 'string') {
    res.status(400).json({ message: 'Store address is required' });
    return;
  }

  try {
    const params = {
      TableName: 'YourDynamoDBTableName',
      Key: { storeAddress },
    };

    const { Item } = await dynamoDb.get(params).promise();
    res.status(200).json({ imageUrl: Item ? Item.imageUrl : null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve image URL', error });
  }
}
