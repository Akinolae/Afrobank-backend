const customer = require('../../controller/userManagement')

module.exports = {
    validateAccount: (req, res) => {
        const { accountNumber } = req.body
        customer.getUser(accountNumber, res)
    },
}
