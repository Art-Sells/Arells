// auth-helpers.ts
import AWS from 'aws-sdk';

// Initialize DynamoDB
AWS.config.update({
  region: 'us-west-1',
  accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY,
});
const dynamoDb = new AWS.DynamoDB.DocumentClient();

export interface AppUser {
  email: string;
  id: string;
  password?: string;
  storeBrandName?: string;
  profileImage?: string;
  storeAddresses?: string[];
  shownNFTs?: string[];
  hiddenNFTs?: string[];
}

const TABLE_NAME = 'ArellsUsers';

export async function findUser(email: string): Promise<AppUser | null> {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
    ProjectionExpression: "email, id, password, storeBrandName, profileImage, storeAddresses, shownNFTs, hiddenNFTs",
  };

  try {
    const result = await dynamoDb.query(params).promise();
    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as AppUser;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error finding user:", error);
    throw new Error('Error accessing database');
  }
}
