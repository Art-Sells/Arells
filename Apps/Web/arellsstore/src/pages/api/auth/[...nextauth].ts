import NextAuth, { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import AWS from 'aws-sdk';


// AWS and DynamoDB configuration
AWS.config.update({
  region: 'us-west-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'ArellsUsers';

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


export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password:  { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials || !credentials.email) {
          throw new Error('Missing credentials');
        }
      
        const user = await findUser(credentials.email);
        if (user && credentials.password && bcrypt.compareSync(credentials.password, user.password)) {
          return user;
        } else {
          throw new Error('Invalid email or password');
        }
      }
      
    }),
  ],
  pages: {
    signIn: '/auth/signin',  // Specify the path to your custom sign-in page
  },
});

export async function findUser(email: string): Promise<AppUser | null> {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
    // Ensure 'ProjectionExpression' includes all fields you need, including 'password'
    ProjectionExpression: "email, id, password, storeBrandName, profileImage, storeAddresses, shownNFTs, hiddenNFTs"
  };

  try {
    const result = await dynamoDb.query(params).promise();
    if (result.Items && result.Items.length > 0) {
      // Return the user if found, ensuring password is included if available
      const user = result.Items[0];
      return {
        email: user.email,
        id: user.id,
        password: user.password, // Make sure this field is correctly named as per your DB schema
        storeBrandName: user.storeBrandName,
        profileImage: user.profileImage,
        storeAddresses: user.storeAddresses,
        shownNFTs: user.shownNFTs,
        hiddenNFTs: user.hiddenNFTs,
      };
    } else {
      // Return null if no user is found
      return null;
    }
  } catch (error) {
    console.error("Error finding user:", error);
    throw new Error('Error accessing database');
  }
}



