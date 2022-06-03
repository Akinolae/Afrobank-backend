const customer = require('../../controller/userManagement')

module.exports = {
  createPin: (req, res) => {
    const { accountNumber, pin } = req.body
    customer.setPin(accountNumber, pin, req, res)
  },
  pinReset: (req, res) => {
    const { accountNumber, pin } = req.body
    customer.setPin(accountNumber, pin, req, res)
  },
}
