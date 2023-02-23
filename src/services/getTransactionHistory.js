const userTransactions = require('../controller/transactions')
module.exports = {
  getTransactionHistory: (req, res) => {
    userTransactions.getTransactionHistory(req, res)
  },
  getSingleTransaction: (req, res) => {
    userTransactions.getSingleTransaction(req, res)
  },
}
