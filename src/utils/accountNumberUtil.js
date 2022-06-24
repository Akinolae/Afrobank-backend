const { createPin } = require('../utils/pinUtils')
const { verifyAccountNumber } = require('./userUtil')

const generate_account_no = () => {
  const acc_no = createPin(10)
  return +acc_no
}

const createAccountNumber = async () => {
  try {
    /*
      1. Generates a unique account Number
      2. Checks if the accountNumber exists or tied to a user
      3. If it exists create another one 
      4. Return the accountNumber if it's not tied to a user
    */
    let accountNumber
    let isAccountNumberExists
    do {
      accountNumber = generate_account_no()
      isAccountNumberExists = await verifyAccountNumber(accountNumber)
    } while (
      isAccountNumberExists.status ||
      accountNumber.toString().length !== 10
    )
    return accountNumber
  } catch (error) {
    throw error
  }
}

module.exports = createAccountNumber
