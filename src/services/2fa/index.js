const { user } = require('../../controller/userManagement')

module.exports = {
  enable2fa: (req, res) => {
    user.enable2fa(req, res)
  },
  disable2fa: (req, res) => {
    user.disable2fa(req, res)
  },
  validate2fa: (req, res) => {
    user.validate2fa(req, res)
  },
  requestCodes: (req, res) => {
    user.requestCodes(req, res)
  },
}
