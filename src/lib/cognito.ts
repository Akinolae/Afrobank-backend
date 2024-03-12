require('dotenv').config();
import { cognito } from './aws';
import { v4 as uuidv4 } from 'uuid'
// require('aws-sdk/lib/maintenance_mode_message').suppress = true

const cognitoPromisify = (cognitoFunction, ...args) => {
  return new Promise((resolve, reject) => {
    try {
      cognitoFunction(...args, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const cognitoUserSignUp = async (args) => {
  let params;
  const { password, firstName, lastName, email, phoneNumber } = args;

  params = {
    ClientId: process.env.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: 'custom:firstName',
        Value: firstName,
      },
      {
        Name: 'custom:lastName',
        Value: lastName,
      },
      {
        Name: 'email',
        Value: email,
      },
      {
        Name: 'custom:password',
        Value: password,
      },
      {
        Name: 'custom:phoneNumber',
        Value: phoneNumber,
      },
      {
        Name: 'custom:user_id',
        Value: uuidv4(),
      },
      {
        Name: 'custom:createdAt',
        Value: String(new Date()),
      },
    ],
  };
  await cognitoPromisify(cognito.signUp.bind(cognito), params);
};

const confirmSignUp = async (args) => {
  const { email, code } = args;
  let params = {
    ClientId: process.env.clientId,
    Username: email,
    ConfirmationCode: code,
  };

  const res = await cognitoPromisify(
    cognito.confirmSignUp.bind(cognito),
    params,
  );
  return res;
};

const cognitoSignIn = async (args) => {
  const { email, password } = args;
  let params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  };
  const data = await cognitoPromisify(
    cognito.initiateAuth.bind(cognito),
    params,
  );
  return data;
};

const cognitoForgotPassword = async (args) => {
  const { email } = args;
  let params = {
    ClientId: process.env.clientId,
    Username: email,
  };
  await cognitoPromisify(cognito.forgotPassword.bind(cognito), params);
};

const forgotPasswordVerification = async (args) => {
  const { email, code, password } = args;
  let params = {
    ClientId: process.env.clientId,
    Username: email,
    ConfirmationCode: code,
    Password: password,
  };
  await cognitoPromisify(cognito.confirmForgotPassword.bind(cognito), params);
};

const getUserFromCognito = async (token) => {
  let params = {
    AccessToken: token,
  };
  const data = await cognitoPromisify(cognito.getUser.bind(cognito), params);
  return data;
};

export {
  cognitoSignIn,
  confirmSignUp,
  cognitoPromisify,
  cognitoUserSignUp,
  getUserFromCognito,
  cognitoForgotPassword,
  forgotPasswordVerification,
};
