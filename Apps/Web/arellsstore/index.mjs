import AWS from 'aws-sdk';

const cognito = new AWS.CognitoIdentityServiceProvider();

export const handler = async (event) => {
    const { email, vatopGroups } = JSON.parse(event.body);

    const params = {
        UserPoolId: process.env.COGNITO_USER_POOL_ID, // Use environment variable
        Username: email,
        UserAttributes: [
            {
                Name: 'custom:vatopGroups',
                Value: JSON.stringify(vatopGroups)
            }
        ]
    };

    try {
        await cognito.adminUpdateUserAttributes(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Vatop groups updated successfully' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not update vatop groups' }),
        };
    }
};