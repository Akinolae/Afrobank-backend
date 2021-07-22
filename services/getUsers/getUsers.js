const customer = require('../../controller/userManagement')

module.exports = {
    getUser: (req, res) => {
        const { accountNumber } = req.body
        customer.getUser(accountNumber, res)
    },
    getUsers: (req, res) => {
        customer.getUsers(res)
    },
}
