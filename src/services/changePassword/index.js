const user = require('../../controller/userManagement/index')

module.exports = {
    changePassword: (req, res) => {
        const { accountNumber, password } = req.body
        user.changePassword(accountNumber, password, res)
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
