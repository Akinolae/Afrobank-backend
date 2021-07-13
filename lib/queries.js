// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const { userTransactions } = require('../utils')
const _ = require('lodash')

const calc_account_balance = async (accountNumber) => {
    const transactions = await userTransactions(accountNumber)
    if (transactions.transactionLength > 0) {
        transactions.transactions.map((data, i) => {
            if (data.transaction_type === 'debit') {
                console.log(data.amount)
            }
        })
    }
}

const updateTransaction = (_customer_, _type_, _accountNumber_, _amount_) => {
    _customer_
        .findOneAndUpdate(
            { accountNumber: _accountNumber_ },
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
