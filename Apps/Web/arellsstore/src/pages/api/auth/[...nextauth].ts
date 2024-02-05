import NextAuth, { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import AWS from 'aws-sdk';

// AWS and DynamoDB configuration
AWS.config.update({
  region: 'your-region',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'users';

export interface AppUser {
  email: string;
  id: string;
  password?: string; // Make the password optional
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
  // ... other next-auth configuration
});

// DynamoDB functions (findUser and createUser)
export async function findUser(email: string): Promise<AppUser | null> {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  };

  const result = await dynamoDb.query(params).promise();

  if (result.Items && result.Items.length > 0) {
    // Return the user if found
    return { email: result.Items[0].email, id: result.Items[0].id };
  } else {
    // Return null if no user is found
    return null;
  }
}


