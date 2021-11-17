const user = require('../../controller/userManagement/index')

module.exports = {
    changePassword: (req, res) => {
        const { accountNumber, password } = req.body
        user.changePassword(accountNumber, password, res)
    },
}
