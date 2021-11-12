const userTransactions = require('../../controller/transactions')
module.exports = {
    getTransactionHistory: (req, res) => {
        const { id } = req.params
        userTransactions.getTransactionHistory(id, res)
    },
    getSingleTransaction: (req, res) => {
        const { transaction_id, accountNumber } = req.body
        req.query = transaction_id
        console.log(req)
        userTransactions.getSingleTransaction(
            accountNumber,
            transaction_id,
            res
        )
        // userTransactions.getSingleTransaction(
        //     accountNumber,
        //     transaction_id,
        //     res
        // )
    },
}
