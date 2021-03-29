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

const calc_account_balance = async (accountNumber) => {
    if(!accountNumber){
        return "Account number is required";
    }
    else {
        try {
           const customer = await fetch_single_user(accountNumber);
           if(customer.status){
               if(!customer.message.transactionHist.length){
                   return {status: false, message: 'No current transaction'};
               }else {
                   return {status: true, message: customer.message.transactionHist};
               }
           } else {
               return customer.message
           }
        }
        catch (e) {
            console.log(e)
        }
    }
}



const fetch_single_user =  async (accountNumber) => {
    try {
       const isAvailable = await Customer.findOne({ accountNumber }).then((data) => data).catch((error) => error)
       if(isAvailable === null){
          return {status: false, message: "Invalid account number"}
       } else{
           return {status: true, message: isAvailable}     
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