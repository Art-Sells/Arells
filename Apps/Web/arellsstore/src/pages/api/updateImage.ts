import * as AWS from 'aws-sdk';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize DynamoDB DocumentClient
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeAddress } = req.query;
  console.log('Store Address:', storeAddress); // Log the received storeAddress

  if (!storeAddress || typeof storeAddress !== 'string') {
    res.status(400).json({ message: 'Store address is required' });
    return;
  }

  try {
    const params = {
      TableName: 'YourDynamoDBTableName',
      Key: { storeAddress },
    };
    console.log('DynamoDB Query Params:', params); // Log the query params

    const { Item } = await dynamoDb.get(params).promise();
    console.log('DynamoDB Response:', Item); // Log the response

    res.status(200).json({ imageUrl: Item ? Item.imageUrl : null });
  } catch (error) {
    console.error('Error in getImageUrl API:', error); // Log the error
    res.status(500).json({ message: 'Failed to retrieve image URL', error });
  }
}

  