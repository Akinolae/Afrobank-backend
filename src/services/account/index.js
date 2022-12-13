const { user } = require('../../controller/userManagement')

module.exports = {
  activateAccount: (req, res) => {
    user.activateUser(req, res)
  },
  deactivateAccount: (req, res) => {
    user.deActivateUser(req, res)
  },
  generateAccountNumber: (req, res) => {
    user.generateAccountNumber(req, res)
  },
}
