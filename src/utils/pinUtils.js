const { generate } = require('otp-generator')
const {
  hashPassword,
  decryptPassword,
  verifyAccountNumber,
} = require('./userUtil')
const { queries } = require('../queries/')
const virtualAccount = require('../model/virtualAccounts')
const { pinReset } = require('./validator')

const setNewPin = async (accountNumber, pin) => {
  try {
    const user = await verifyAccountNumber(accountNumber)
    if (user.status) {
      const hashedPin = await hashPassword(pin, 10)
      await queries.updateToDb(
        [{ accountNumber: accountNumber }, { $set: { pin: hashedPin } }],
        null,
        virtualAccount
      )

      return { status: true, message: pinReset.message }
    } else throw user.message
  } catch (err) {
    throw err || 'Something went wrong'
  }
}

const createPin = (length = 4) => {
  return generate(length, {
    alphabets: false,
    digits: true,
    specialChars: false,
    upperCase: false,
  })
}

const isPinValid = async (data, pin) => {
  if (!data) return
  return await decryptPassword(data, pin)
}
module.exports = { isPinValid, createPin, setNewPin }
