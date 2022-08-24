const customer = require('../../controller/transactions')

module.exports = {
  transfer: (req, res) => {
    customer.transfer(req, res)
  },
}
