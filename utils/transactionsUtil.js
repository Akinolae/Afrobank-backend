const { verifyAccountNumber } = require('./userUtil')

const transactionHistory = async (accountNumber) => {
    try {
        const data = await verifyAccountNumber(accountNumber)
        if (!data.status) {
            return { status: false, response: data.message }
        } else {
            return { status: true, response: data.user.transactions }
        }
    } catch (error) {
        throw error
    }
}

module.exports = transactionHistory
