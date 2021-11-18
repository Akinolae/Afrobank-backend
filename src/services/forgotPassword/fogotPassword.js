const user = require('../../controller/userManagement')

const forgotPassword = (req, res) => {
    const { accountNumber, otp } = req.body
    user.forgotPassword(accountNumber, otp, res)
}

const sendOtp = (req, res) => {
    const { email } = req.body
    user.sendPasswordOtp(email, res)
}

module.exports = { forgotPassword, sendOtp }
