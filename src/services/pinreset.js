const { user } = require('../controller/userManagement')

module.exports = {
  createPin: (req, res) => {
    const { accountNumber, pin } = req.body
    user.setPin(accountNumber, pin, req, res)
  },
  pinReset: (req, res) => {
    const { accountNumber, pin } = req.body
    user.setPin(accountNumber, pin, req, res)
  },
}
