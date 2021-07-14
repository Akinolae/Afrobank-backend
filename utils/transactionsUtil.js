const { fetch_single_user } = require('./userUtil')

const transactionHistory = async (accountNumber) => {
    try {
        const data = await fetch_single_user(accountNumber)
        if (!data.status) {
            throw data.message
        } else {
            return {
                transactionLength: data.message.transactions.length,
                transactions: data.message.transactions,
            }
        }
    } catch (error) {
        throw error
    }
}

module.exports = transactionHistory
