const { createPin } = require('../utils/pinUtils')
const { verifyAccountNumber, verifyCard } = require('./userUtil')

const generate_account_no = (length) => {
  let acc_no
  do {
    acc_no = createPin(length)
  } while (acc_no.toString() !== length)
  return +acc_no
}

const createAccountNumber = async (params, length = 10) => {
  try {
    const { type } = params
    /*
      1. Generates a unique account Number
      2. Checks if the accountNumber exists or tied to a user
      3. If it exists create another one 
      4. Return the accountNumber if it's not tied to a user
    */
    let accountNumber
    let isAccountNumberExists
    do {
      accountNumber = generate_account_no(length)
      isAccountNumberExists = type.includes('accountNumber')
        ? await verifyAccountNumber(accountNumber)
        : await verifyCard(accountNumber)
    } while (
      isAccountNumberExists.status ||
      accountNumber.toString().length !== length
    )
    return accountNumber
  } catch (error) {
    throw error
  }
}

module.exports = createAccountNumber
