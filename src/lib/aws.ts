import * as AWS from 'aws-sdk';
AWS.config.update({ region: process.env.AWS_REGION });

const cognito = new AWS.CognitoIdentityServiceProvider({
    apiVersion: 'latest',
});

export { cognito };
