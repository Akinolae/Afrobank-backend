const { createPin } = require('../utils/pinUtils')
const { verifyAccountNumber, verifyCard } = require('./userUtil')
const generator = require('creditcard-generator')

const generate_account_no = (length) => {
  const acc_no = createPin(length)
  return +acc_no
}

const createAccountNumber = async (params, length = 10) => {
  try {
    const { type, isCard } = params

    /*
      1. Generates a unique account Number
      2. Checks if the accountNumber exists or tied to a user
      3. If it exists create another one 
      4. Return the accountNumber if it's not tied to a user
    */
    let accountNumber
    let isAccountNumberExists
    do {
      accountNumber = !!isCard
        ? generator.GenCC('Mastercard')
        : generate_account_no(length)

      isAccountNumberExists = type.includes('accountNumber')
        ? await verifyAccountNumber(accountNumber)
        : await verifyCard(accountNumber[0])
    } while (
      isAccountNumberExists.status ||
      accountNumber.toString().length !== length
    )
    return accountNumber[0]
  } catch (error) {
    throw error
  }
}

module.exports = createAccountNumber
