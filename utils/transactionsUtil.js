const { verifyAccountNumber } = require('./userUtil')

const filterTransactions = (type, transactions) => {
    return transactions.response.filter(
        (data) => data.transaction_type === type
    )
}

const sumAmount = (transactions) => {
    return transactions.reduce((a, b) => Number(a) + (Number(b.amount) || 0), 0)
}

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

const calc_account_balance = async (accountNumber) => {
    let transactions, getAllCredits, getAllDebits, sumCreditTotal, sumDebitTotal
    try {
        transactions = await transactionHistory(accountNumber)
        getAllCredits = filterTransactions('credit', transactions)
        getAllDebits = filterTransactions('debit', transactions)

        sumCreditTotal = sumAmount(getAllCredits)
        sumDebitTotal = sumAmount(getAllDebits)

        return { sumCreditTotal, sumDebitTotal }
    } catch (error) {
        throw error
    }
}
module.exports = { transactionHistory, calc_account_balance }
