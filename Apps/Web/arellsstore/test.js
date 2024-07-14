
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({
    region: 'us-west-1', // Specify the AWS region you want to simulate
    endpoint: 'http://localhost:3000', // Local endpoint if using tools like AWS SAM Local
    accessKeyId: 'YOUR_ACCESS_KEY_ID', // Local credentials for testing
    secretAccessKey: 'YOUR_SECRET_ACCESS_KEY', // Local credentials for testing
    sessionToken: 'YOUR_SESSION_TOKEN' // Local credentials for testing
});

const params = {
    FunctionName: 'UpdateVatopGroups',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(require('./event.json'))
};

lambda.invoke(params, (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(JSON.parse(data.Payload));
});