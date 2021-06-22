require('dotenv').config()
const customer = require('../../controller/index')

module.exports = {
    localLogin: (req, res) => {
        const { accountNumber, firstName } = req.body
        customer.login(accountNumber, firstName, res)
    },
}
