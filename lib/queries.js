// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions 
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const db = require('../model/customer');

const transactions = [
    {
        transaction_id: 1,
        transaction_type: 'credit',
        amount: 10000
    },
    {
        transaction_id: 2,
        transaction_type: 'debit',
        amount: 10000
    },
    {
        transaction_id: 3,
        transaction_type: 'credit',
        amount: 10000
    },
    {
        transaction_id: 4,
        transaction_type: 'debit',
        amount: 10000
    },
]

const calc_account_balance = (accountNumber) => {
    try {
        if(accountNumber){
            db.findOne({raw: true, accountNumber: accountNumber}, (err, data) => {
                if(!data) {
                    return {status: false, message: "No user found"};
                }else {
                    if(!data.transactionHist.length) {
                        return {status: true, message: "No transaction available"}
                    }
                    else {
                        return {status: true, message: data.transactionHist};
                    }
                }
            })
        }
    }
    catch (e) {
        console.log(e)
    }
   
}

const fetch_single_user =   (accountNumber) => {
    try {
        if(accountNumber){
            if(!transactions.length) {
                return {status: false, message: "no user available"}
            }else {
                return {status: true, message: transactions}
            }
        }else {
            return { status: false, message: 'Account number is needed'};
        }
    }
    catch (err) {
        console.log(err);
    }
}
module.exports = {
    calc_account_balance,
    fetch_single_user
}