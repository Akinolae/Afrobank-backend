const { generate } = require('otp-generator')
const { decryptPassword, verifyAccountNumber, hashPassword } = require('./userUtil')

const setNewPin = async (accountNumber, pin) => {
  try {
    const user = await verifyAccountNumber(accountNumber)
    if (user.status) {
      const hashedPin = await hashPassword(pin, 10)
      await queries.updateToDb([
        { accountNumber: accountNumber },
        { $set: { pin: hashedPin } },
      ])

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
