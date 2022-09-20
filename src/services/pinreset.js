const { user } = require('../controller/userManagement')

module.exports = {
  createPin: (req, res) => {
    const { pin } = req.body
    user.setPin(pin, res)
  },
  pinReset: (req, res) => {
    const { accountNumber, pin } = req.body
    user.setPin(accountNumber, pin, req, res)
  },
}
