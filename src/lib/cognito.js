require('dotenv').config()
const { cognito } = require('./aws')
const { v4: uuidv4 } = require('uuid')

const cognitoPromisify = (cognitoFunction, ...args) => {
  return new Promise((resolve, reject) => {
    try {
      cognitoFunction(...args, (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

const cognitoUserSignUp = async (args) => {
  let params
  const { password, firstName, lastName, email, phoneNumber } = args

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
        Value: uuidv4().toString(),
      },
      {
        Name: 'custom:createdAt',
        Value: String(new Date()),
      },
    ],
  }

  await cognitoPromisify(cognito.signUp.bind(cognito), params)
}

const confirmSignUp = async (args) => {
  const { email, code } = args
  let params = {
    ClientId: process.env.clientId,
    Username: email,
    ConfirmationCode: code,
  }

  const res = await cognitoPromisify(
    cognito.confirmSignUp.bind(cognito),
    params
  )
  return res
}

const cognitoSignIn = async (args) => {
  const { email, password } = args
  let params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.clientId,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  }
  const data = await cognitoPromisify(
    cognito.initiateAuth.bind(cognito),
    params
  )
  return data
}

const getUserFromCognito = async (token) => {
  let params = {
    // ClientId: process.env.clientId,
    AccessToken: token,
  }
  const data = await cognitoPromisify(cognito.getUser.bind(cognito), params)
  return data
}

module.exports = {
  cognitoSignIn,
  confirmSignUp,
  cognitoPromisify,
  cognitoUserSignUp,
  getUserFromCognito,
}
