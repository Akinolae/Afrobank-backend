const user = require('../../controller/userManagement')

const forgotPassword = (req, res) => {
    const { accountNumber, otp } = req.body
    user.forgotPassword(accountNumber, otp, res)
}

const sendOtp = (req, res) => {
    const { accountNumber } = req.body
    user.sendPasswordOtp(accountNumber, res)
}

module.exports = { forgotPassword, sendOtp }
