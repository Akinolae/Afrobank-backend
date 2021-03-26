// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions 
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const Customer = require('../model/customer');

console.log(Customer);
const user = {
    name: 'akinola',
    surname: 'lams',
    amount: 10000
}
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
            db.findOne({ accountNumber }, (err, data) => {
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
    if(accountNumber){
        return {user_exists: true, data: user}
    } else {
        return {user_exists: false, data: null}
    }
    // try {
    //    const isAvailable =  Customer.findOne({ accountNumber });
    //    return isAvailable;
    // }
    // catch (err) {
    //     console.log(err);
    // }
}
module.exports = {
    calc_account_balance,
    fetch_single_user
}