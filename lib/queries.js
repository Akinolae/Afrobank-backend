// 1. Ensure that the db consists of an array of transactions by the currenct user
// 2. map through each transaction to get all the amount of all the transactions
// 3. calculate add all transactions where credit
// 4. subtract all transactions where debit
// 5. return the result as the current account balance.

const calc_account_balance = async (accountNumber) => {
    if (!accountNumber) {
        return 'Account number is required'
    } else {
        try {
            const customer = await fetch_single_user(accountNumber)
            if (customer.status) {
                if (!customer.message.transactionHist.length) {
                    return { status: false, message: 'No current transaction' }
                } else {
                    return {
                        status: true,
                        message: customer.message.transactionHist,
                    }
                }
            } else {
                return customer.message
            }
        } catch (e) {
            throw e
        }
    }
}

module.exports = {
    calc_account_balance,
}
