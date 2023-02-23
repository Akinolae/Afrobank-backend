const transactions = require('../model/transactions')
const { createPin } = require('./pinUtils')
const { v4: uuidv4 } = require('uuid')
const createAccountNumber = require('./accountNumberUtil')
const { createExpiryDate } = require('./dateUtils')
const { verifyAccountNumber } = require('./userUtil')
const { ACTIONS, dbActionGenerator } = require('../lib/mongoose')

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
      await dbActionGenerator(ACTIONS.FIND, {
        collection: transactions,
        data: [{ user_id: res.user_id }],
      })
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

const updateBalance = async (customer, type = '', accountNumber, amount) => {
  const data = await verifyAccountNumber(accountNumber)

  let currentBalance = 0
  try {
    type.toLowerCase() === 'credit'
      ? (currentBalance += +data.user.accountBalance + +amount)
      : (currentBalance = +data.user.accountBalance - +amount)

    await dbActionGenerator(ACTIONS.FINDONEANDUPDATE, {
      collection: customer,
      data: [{ accountNumber }, { $set: { accountBalance: currentBalance } }],
    })
  } catch (e) {
    throw e
  }
}

const generateCard = async (params) => {
  let info

  try {
    if (typeof params !== 'object') throw 'Transaction info should be an object'
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
    cardNumber: userInfo.cardNumber,
    accountNumber: userInfo.accountNumber,
    transaction_type: trxType,
    user_id: userInfo.ownerId,
    transaction_date: new Date(),
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

module.exports = {
  generateCard,
  updateBalance,
  generateTrxInfo,
  transactionHistory,
  calc_account_balance,
  fetchAllNotifications,
}
