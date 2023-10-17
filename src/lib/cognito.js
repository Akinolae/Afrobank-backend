require('dotenv').config()
const { hashPassword } = require('../utils/userUtil')
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

  console.log(params)
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

module.exports = {
  confirmSignUp,
  cognitoPromisify,
  cognitoUserSignUp,
}
