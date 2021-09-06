const customer = require('../../controller/transactions')

module.exports = {
    getAccountBalance: (req, res) => {
        const { id } = req.params
        customer.getBalance(id, res)
    },
}
