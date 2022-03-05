const { sendMail, generateRandomEmail } = require('./emailUtils')
const { createPin, isPinValid } = require('./pinUtils')
const createAccountNumber = require('./accountNumberUtil')
const {
    transactionHistory,
    calc_account_balance,
    updateBalance,
    fetchAllNotifications,
} = require('./transactionsUtil')
const logError = require('./logger')
const validateAmount = require('./amountValidator')
const job = require('./cron')

module.exports = {
    calc_account_balance,
    createAccountNumber,
    createPin,
    fetchAllNotifications,
    generateRandomEmail,
    isPinValid,
    logError,
    sendMail,
    transactionHistory,
    updateBalance,
    validateAmount,
}
