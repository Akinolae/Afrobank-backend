const userTransactions = require('../../controller/transactions')
module.exports = {
    getTransactionHistory: (req, res) => {
        const { id } = req.params
        userTransactions.getTransactionHistory(id, res)
    },
}
