require('dotenv').config()
const user = require('../../controller/userManagement')
module.exports = {
    localLogin: (req, res) => {
        const { accountNumber, firstName } = req.body
        user.login(accountNumber, firstName, res)
    },
}
