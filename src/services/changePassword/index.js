const { user } = require('../../controller/userManagement/index')

module.exports = {
  changePassword: (req, res) => {
    const { password } = req.body
    user.changePassword(password, req, res)
  },
  forgotPassword: (req, res) => {
    const { accountNumber, otp } = req.body
    user.forgotPassword(accountNumber, otp, res)
  },
  sendOtp: (req, res) => {
    const { email } = req.body
    user.sendPasswordOtp(email, res)
  },
}
