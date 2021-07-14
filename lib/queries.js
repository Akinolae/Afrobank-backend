// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const { transactionHistory } = require('../utils')
const _ = require('lodash')

const calc_account_balance = async (accountNumber) => {
    const transactions = await transactionHistory(accountNumber)
    if (transactions.transactionLength > 0) {
        transactions.transactions.map((data, i) => {
            let credit
            let debit
            if (data.transaction_type === 'debit') {
                console.log(data.amount)
            }
        })
    } else {
        console.log([])
        return []
    }
}

const updateTransaction = (_customer_, _type_, _email_, _amount_) => {
    _customer_
        .findOneAndUpdate(
            { email: _email_ },
            {
                $push: {
                    transactions: {
                        transaction_id: 1,
                        transaction_type: _type_,
                        amount: _amount_,
                    },
                },
            }
        )
        .then((data) => console.log(data))
}

module.exports = {
    calc_account_balance,
    updateTransaction,
}
