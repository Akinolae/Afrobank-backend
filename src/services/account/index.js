const { user } = require('../../controller/userManagement')
const { virtualAccount } = require('../../controller/virtualAccount')

module.exports = {
  activateAccount: (req, res) => {
    user.activateUser(req, res)
  },
  deactivateAccount: (req, res) => {
    user.deActivateUser(req, res)
  },
  generateAccountNumber: (req, res) => {
    virtualAccount.generateVirtualAccount(req, res)
  },
}
