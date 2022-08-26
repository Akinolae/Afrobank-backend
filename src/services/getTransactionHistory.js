const userTransactions = require('../controller/transactions')
module.exports = {
  getTransactionHistory: (req, res) => {
    userTransactions.getTransactionHistory(req, res)
  },
  getSingleTransaction: (req, res) => {
    const { transaction_id, accountNumber } = req.body
    req.query = transaction_id

    userTransactions.getSingleTransaction(accountNumber, transaction_id, res)
  },
}
