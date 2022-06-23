const { createPin } = require('../utils/pinUtils')
const { verifyAccountNumber } = require('./userUtil')

const generate_account_no = () => {
  const acc_no = createPin(10)
  return +acc_no
}

const createAccountNumber = async () => {
  try {
    let accountNumber
    let isAccountNumberExists
    do {
      accountNumber = generate_account_no()
      isAccountNumberExists = await verifyAccountNumber(accountNumber)
    } while (isAccountNumberExists.status)
    return accountNumber
  } catch (error) {
    throw error
  }
}

module.exports = createAccountNumber
