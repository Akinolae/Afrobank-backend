const userTransactions = require('../../controller/transactions')
module.exports = {
    getTransactionHistory: (req, res) => {
        const { id } = req
        userTransactions.getTransactionHistory(id, res)
    },
}
