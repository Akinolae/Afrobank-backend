const { user } = require('../../controller/userManagement/index')

module.exports = {
  changePassword: (req, res) => {
    const { password } = req.body
    user.changePassword(password, req, res)
  },
  forgotPassword: (req, res) => {
    user.forgotPassword(req, res)
  },
  forgotPasswordCodeVerification: (req, res) => {
    user.forgotPasswordCodeVerification(req, res)
  },
}
