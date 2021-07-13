const { fetch_single_user } = require('./userUtil')

const userTransactions = async (accountNumber) => {
    const data = await fetch_single_user(accountNumber)
    return {
        transactionLength: data.message.transactions.length,
        transactions: data.message.transactions,
    }
}

module.exports = userTransactions
