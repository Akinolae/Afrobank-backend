// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions 
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const db = require('../model/customer');

const calc_account_balance = async (accountNumber) => {
    var response = [];
    accountNumber && (
        db.findOne({accountNumber: accountNumber}, (err, data) => {
            if(!data) {
                return response.push("unable to retrieve account balance");
            }else {
                !data.transactionHist.length ? response = 'No transaction available' : response = data.transactionHist
            }
        })
    )
    return response;
}

module.exports = {
    calc_account_balance
}