const jwt = require('jsonwebtoken')
const encrypt = require('bcryptjs')
const CryptoJS = require('crypto-js')
const card = require('../model/cards')
const { queries } = require('../queries')
const { generate } = require('otp-generator')
const { ACTIONS } = require('../lib/mongoose')
const account = require('../model/virtualAccounts')
const { StatusCodes } = require('http-status-codes')
const { response } = require('../controller/responseHandler')
const { getUserFromCognito } = require('../lib/cognito')

const fetch_single_user = async (params, byEmail = true) => {
  try {
    params = byEmail ? { email: params } : { user_id: params }
    const isAvailable = await queries.getFromDb([params], ACTIONS.FINDONE)

    return isAvailable === null || isAvailable === undefined
      ? { status: false, message: 'invalid email address or password' }
      : { status: true, message: isAvailable }
  } catch (err) {
    throw err
  }
}

const verifyAccountNumber = async (accountNumber) => {
  try {
    const isUserAvailable = await queries.getFromDb(
      [{ accountNumber }],
      ACTIONS.FINDONE,
      account
    )
    const response =
      isUserAvailable === null || isUserAvailable === 'undefined'
        ? { status: false, message: 'Unable to verify account number' }
        : { status: true, user: isUserAvailable }
    return response
  } catch (error) {
    throw error
  }
}

const useCrypto = ({ payLoad = '', encrypt = true }) => {
  let data
  const message =
    typeof payLoad === 'string' ? payLoad : JSON.stringify(payLoad)
  if (encrypt) {
    data = CryptoJS.AES.encrypt(message, process.env.TOKEN_SECRET).toString()
  } else {
    const decryptCode = CryptoJS.AES.decrypt(message, process.env.TOKEN_SECRET)
    data = decryptCode.toString(CryptoJS.enc.Utf8)
  }
  return data
}

const verifyCard = async (cardNumber) => {
  try {
    const isUserAvailable = (await queries.getFromDb([], ACTIONS.FIND, card))
      .map((card) => ({
        id: card._id,
        ...JSON.parse(useCrypto({ payLoad: card.cardToken, encrypt: false })),
      }))
      .find((card) => card.cardNumber === cardNumber)

    const response =
      isUserAvailable === null || isUserAvailable === undefined
        ? { status: false, message: 'Invalid card' }
        : { status: true, message: isUserAvailable }
    return response
  } catch (error) {
    throw error
  }
}

const login_notify = (data) => {
  const date = new Date()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const customerCareLine = '08183430438'

  const msg = `
  <div>
    <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong> Afrobank </strong></h2><br>
    <p>Dear <strong> ${data.firstName} ${data.lastName} ${data.surName} </strong></p>
    <p>A login attempt was made in your account at <strong>${hours}:${minutes}</strong>.</p>
    <p>If this is you kindly ignore, else, contact us at <strong>${customerCareLine}</strong>.</p><br>
    <p>Thank you for choosing AfroBank.</p>
  </div>
`
  return msg
}

const generateUserAccessToken = (payload, expires = '2 days') => {
  return jwt.sign(payload, process.env.TOKEN_SECRET, {
    expiresIn: expires,
  })
}

const verifyUserAccessToken = async (token) => {
  try {
    const data = await getUserFromCognito(token)
    return data
  } catch (error) {
    throw error
  }
}

const generate2FAcodes = async () => {
  const length = 5
  let hashedCodes = []
  let codes = []

  for (var i = 0; i <= length; i++) {
    const code = generate(6, {
      alphabets: false,
      digits: true,
      specialChars: false,
      upperCase: false,
    })
    codes.push(code)
    hashedCodes.push(await hashPassword(code))
  }
  return {
    hashedCodes,
    codes,
  }
}

const hashPassword = async (password, length = 15) => {
  if (typeof password !== 'string') {
    throw 'Invalid params'
  }

  const hash = await encrypt.hash(password, length)
  return hash
}

const decryptPassword = async (password1, password2) => {
  if (!password2 || password2 === null) {
    throw 'Please create a pin to proceed'
  }
  return await encrypt.compare(password1, password2)
}

const validate2FA = async (codes = [], code) => {
  let responseValue = []
  await Promise.all(
    codes.map(async (data) => {
      const isValid = !!data && (await decryptPassword(String(code), data))
      responseValue.push({
        isValid,
        data,
      })
    })
  )

  return responseValue
}

const verifyUser = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization
    const token = !!authToken ? authToken.split(' ')[1] : ''
    const verify = await verifyUserAccessToken(token)

    !verify
      ? response('user not found', false, StatusCodes.UNPROCESSABLE_ENTITY, res)
      : (res.user = verify)
    next()
  } catch (error) {
    const err = error.toString()
    const errMessage = err.includes('invalid')
      ? error
      : err.includes('expired')
      ? 'Token expired'
      : 'no token provided'
    response(errMessage, false, StatusCodes.UNAUTHORIZED, res)
  }
}

const isAdmin = (params) => {
  return params === 'admin' ? true : false
}

module.exports = {
  isAdmin,
  useCrypto,
  verifyUser,
  verifyCard,
  validate2FA,
  hashPassword,
  login_notify,
  decryptPassword,
  generate2FAcodes,
  fetch_single_user,
  verifyAccountNumber,
  verifyUserAccessToken,
  generateUserAccessToken,
}
