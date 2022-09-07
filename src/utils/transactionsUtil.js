const { verifyAccountNumber } = require('./userUtil')
const transactions = require('../model/transactions')

const filterTransactions = (type, transactions) => {
  return transactions.response.filter((data) => data.transaction_type === type)
}

const sumAmount = (transactions) => {
  return transactions.reduce((a, b) => Number(a) + (Number(b.amount) || 0), 0)
}

const transactionHistory = async (accountNumber) => {
  try {
    const [data, trx] = await Promise.all([
      verifyAccountNumber(accountNumber),
      transactions.find(),
    ])

    if (!data.status) return { status: false, response: data.message }
    else {
      const userTransactions = trx
        .filter((user) => user.user_id.toString() === data.user._id.toString())
        .sort(
          (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
        )
      return { status: true, response: userTransactions }
    }
  } catch (error) {
    throw error
  }
}

const fetchAllNotifications = async (accountNumber) => {
  try {
    const data = await verifyAccountNumber(accountNumber)
    return !data.status
      ? { status: false, response: data.message }
      : { status: true, response: data.user.notifications }
  } catch (error) {
    throw error
  }
}

const updateBalance = async (customer, type, accountNumber, amount) => {
  const data = await verifyAccountNumber(accountNumber)
  let currentBalance = 0
  try {
    if (type === 'credit') {
      currentBalance = +data.user.accountBalance + +amount
    } else currentBalance = +data.user.accountBalance - +amount
    await customer.findOneAndUpdate(
      { accountNumber },
      { $set: { accountBalance: currentBalance } }
    )
  } catch (e) {
    throw e
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
  transactionHistory,
  calc_account_balance,
  updateBalance,
  fetchAllNotifications,
}
