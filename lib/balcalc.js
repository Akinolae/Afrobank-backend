// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions 
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const db = require('../model/customer');
const transactions = [
    {
        transaction_type: 'credit',
        amount: 10000,
        time: 9,
        day: '20 of march, 2021'
    },
    {
        transaction_type: 'debit',
        amount: 10000,
        time: 9,
        day: '20 of march, 2021'
    },
    {
        transaction_type: 'credit',
        amount: 10000,
        time: 9,
        day: '20 of march, 2021'
    },
    {
        transaction_type: 'debit',
        amount: 10000,
        time: 9,
        day: '20 of march, 2021'
    },
    {
        transaction_type: 'credit',
        amount: 10000,
        time: 9,
        day: '20 of march, 2021'
    },

]
const calc_account_balance = async (accountNumber) => {
    console.log(db.length)
    var balance;
   {accountNumber && transactions.reduce((data, i) => {
        }
    )}
}

module.exports = {
    calc_account_balance
}