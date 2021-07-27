// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const { transactionHistory } = require('../utils')
const { verifyAccountNumber } = require('../utils/userUtil')
const { nanoid } = require('nanoid')
const { pinReset } = require('./constants')

const filterTransactions = (type, transactions) => {
    const data = transactions.response.filter(
        (data) => data.transaction_type === type
    )
    return data
}

const sumAmount = (transactions) => {
    return transactions.reduce((a, b) => Number(a) + (Number(b.amount) || 0), 0)
}

const calc_account_balance = async (accountNumber) => {
    try {
        const transactions = await transactionHistory(accountNumber)
        const getAllCredits = filterTransactions('credit', transactions)
        const getAllDebits = filterTransactions('debit', transactions)

        const sumCreditTotal = sumAmount(getAllCredits)
        const sumDebitTotal = sumAmount(getAllDebits)

        return { sumCreditTotal, sumDebitTotal }
    } catch (error) {
        throw error
    }
}

const updateBalance = async (customer, type, accountNumber, amount) => {
    const data = await verifyAccountNumber(accountNumber)
    let currentBalance = 0
    try {
        if (type === 'credit') {
            currentBalance = data.user.accountBalance + amount
        } else {
            currentBalance = data.user.accountBalance - amount
        }
        await customer.findOneAndUpdate(
            { accountNumber },
            { $set: { accountBalance: currentBalance } }
        )
    } catch (e) {
        throw e
    }
}

const updateTransaction = async (
    _customer_,
    _type_,
    _accountNumber,
    _amount_
) => {
    const date = new Date()
    const transactionID = `${nanoid()}|${_type_}|${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}|${_amount_}`
    try {
        const response = await _customer_.findOneAndUpdate(
            { accountNumber: _accountNumber },
            {
                $push: {
                    transactions: {
                        transaction_id: transactionID.toUpperCase(),
                        transaction_type: _type_,
                        amount: _amount_,
                    },
                },
            }
        )
        await updateBalance(_customer_, _type_, _accountNumber, _amount_)
        return response
    } catch (error) {
        throw new Error(error)
    }
}

const setNewPin = async (_customer_, accountNumber, pin) => {
    try {
        const user = await verifyAccountNumber(accountNumber)

        if (user.status) {
            const resp = await _customer_.updateOne(
                { accountNumber: accountNumber },
                { $set: { pin: pin } }
            )
            return { status: true, message: pinReset.message }
        } else {
            throw user
        }
    } catch (err) {
        throw err || 'Something went wrong'
    }
}
module.exports = {
    calc_account_balance,
    updateTransaction,
    setNewPin,
}
