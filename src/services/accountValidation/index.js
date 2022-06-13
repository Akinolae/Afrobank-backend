const { user } = require('../../controller/userManagement')

module.exports = {
  validateAccount: (req, res) => {
    const { accountNumber } = req.body
    user.getUser(accountNumber, res)
  },
}
