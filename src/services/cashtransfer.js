const customer = require('../controller/transactions/index')

module.exports = {
  transfer: (req, res) => {
    customer.transfer(req, res)
  },
  getBankList: (req, res) => {
    customer.getBankList(req, res)
  }
}
