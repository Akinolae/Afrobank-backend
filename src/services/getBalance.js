const customer = require('../controller/transactions')

module.exports = {
  getAccountBalance: (req, res) => {
    const { account } = req.query
    customer.getBalance(account, res)
  },
}
