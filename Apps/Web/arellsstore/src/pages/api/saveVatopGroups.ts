import AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  const body = event.body ? JSON.parse(event.body) : null;

  if (!body) {
    console.log('Invalid request body:', event.body);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const { email, vatopGroups } = body;

  if (!email || !vatopGroups) {
    console.log('Missing email or vatopGroups in request body');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing email or vatopGroups' }),
    };
  }

  const userParams = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    Username: email,
    UserAttributes: [
      {
        Name: 'custom:vatopGroups',
        Value: JSON.stringify(vatopGroups),
      },
    ],
  };

  console.log('Updating user attributes for:', email);
  console.log('Vatop Groups:', vatopGroups);
  console.log('User Params:', JSON.stringify(userParams, null, 2));

  try {
    await cognito.adminUpdateUserAttributes(userParams).promise();
    console.log('Attributes updated successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Attributes updated successfully' }),
    };
  } catch (error) {
    console.error('Error updating user attributes:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update user attributes' }),
    };
  }
};