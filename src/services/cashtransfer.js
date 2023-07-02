const { userTransactions } = require('../controller/transactions/index')

module.exports = {
  transfer: (req, res) => {
    userTransactions.transfer(req, res)
  },
  getBankList: (req, res) => {
    userTransactions.getBankList(req, res)
  },
}
