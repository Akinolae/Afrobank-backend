const { verifyAccountNumber } = require('./userUtil')

const transactionHistory = async (accountNumber) => {
    try {
        const data = await verifyAccountNumber(accountNumber)
        console.log(data)

        // if (!data.status) {
        //     throw data.message
        // } else {
        //     return {
        //         transactionLength: data.message.transactions.length,
        //         transactions: data.message.transactions,
        //     }
        // }
    } catch (error) {
        throw error
    }
}

module.exports = transactionHistory
