const trxModel = require('../model/transactions')
const { createPin } = require('./pinUtils')
const { v4: uuidv4 } = require('uuid')
const createAccountNumber = require('./accountNumberUtil')
const { createExpiryDate } = require('./dateUtils')
const { verifyAccountNumber, decryptPassword } = require('./userUtil')
const validateAmount = require('./amountValidator')
const coreTransfer = require('../lib/initTrx')
const { queries } = require('../queries/queries')

const filterTransactions = (type, transactions) => {
  return transactions.response.filter((data) => data.transaction_type === type)
}

const sumAmount = (transactions) => {
  return transactions.reduce((a, b) => Number(a) + (Number(b.amount) || 0), 0)
}

const transactionHistory = async (accountNumber, res) => {
  try {
    const data = await verifyAccountNumber(accountNumber)
    if (!data.status) throw data.message
    const trx = (
      await queries.getFromDb([{ user_id: res.user_id }], null, trxModel)
    )
      .filter((account) => account.account_id === data.user.account_id)
      .sort(
        (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
      )

    return { status: true, response: trx }
  } catch (error) {
    throw error
  }
}

const fetchAllNotifications = async (accountNumber) => {
  try {
    const data = await verifyAccountNumber(accountNumber)
    if (!data.status) throw data.message

    return { status: true, response: data.user.notifications }
  } catch (error) {
    throw error
  }
}

const generateCard = async (params) => {
  let info

  try {
    if (typeof params !== 'object')
      throw `Transaction info should be an object got ${typeof params}`
      
    const cardNumber = await createAccountNumber(
      { type: 'Card', isCard: true },
      16
    )

    info = {
      cardNumber,
      created: new Date(),
      expiryDate: createExpiryDate(new Date(), 2),
      ownerId: params.message.user_id,
      pin: createPin(),
      CVV: createPin(3),
      isActive: true,
      card_id: uuidv4(),
    }

    return info
  } catch (error) {
    throw error
  }
}

const generateTrxInfo = (userInfo, trxType, description, amount) => {
  return {
    transaction_type: trxType,
    user_id: userInfo.user_id,
    transaction_date: new Date(),
    account_id: userInfo.account_id,
    description: !!description
      ? `AFROBANK-CARD||TRX-${description ?? ''}`
      : 'AFROBANK-CARD||TRX',
    amount,
  }
}

const calc_account_balance = async (accountNumber) => {
  let transactions, getAllCredits, getAllDebits, sumCreditTotal, sumDebitTotal
  try {
    transactions = await transactionHistory(accountNumber)
    getAllCredits = filterTransactions('credit', transactions)
    getAllDebits = filterTransactions('debit', transactions)

    sumCreditTotal = sumAmount(getAllCredits)
    sumDebitTotal = sumAmount(getAllDebits)

    return { sumCreditTotal, sumDebitTotal }
  } catch (error) {
    throw error
  }
}

const trxCore = async (params) => {
  const { user, trxPin, amount, isCard = false, trxData = [] } = params

  const [isPinValid, isAmmountValid] = await Promise.all([
    decryptPassword(trxPin, user.pin),
    validateAmount(user, amount),
  ])

  if (!isPinValid) throw 'Invalid pin'

  if (!!isAmmountValid) throw isAmmountValid

  try {
    await coreTransfer(trxData)
  } catch (error) {
    throw error
  }
}

module.exports = {
  trxCore,
  generateCard,
  generateTrxInfo,
  transactionHistory,
  calc_account_balance,
  fetchAllNotifications,
}
