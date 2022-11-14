const { sendMail, generateRandomEmail } = require('./emailUtils')
const { createPin, isPinValid } = require('./pinUtils')
const createAccountNumber = require('./accountNumberUtil')
const {
  generateCard,
  updateBalance,
  generateTrxInfo,
  transactionHistory,
  calc_account_balance,
  fetchAllNotifications,
} = require('./transactionsUtil')
const logError = require('./logger')
const validateAmount = require('./amountValidator')
const { generateUserAccessToken, verifyUserAccessToken } = require('./userUtil')

module.exports = {
  logError,
  sendMail,
  createPin,
  isPinValid,
  generateCard,
  updateBalance,
  validateAmount,
  generateTrxInfo,
  transactionHistory,
  generateRandomEmail,
  createAccountNumber,
  calc_account_balance,
  fetchAllNotifications,
  verifyUserAccessToken,
  generateUserAccessToken,
}
