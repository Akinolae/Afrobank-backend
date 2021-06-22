'use strict'
const {
    customerLogin,
    customerModel,
    fetchUsers,
    getBalance,
    pinReset,
    registerCustomer,
    transfer,
    sendEmail,
    // sendText,
    singleUser,
    validateAccount,
} = require('./testRequests')

// Call all test suites;
sendEmail()
singleUser()
transfer()
customerLogin()
customerModel()
getBalance()
pinReset()
fetchUsers()
registerCustomer()
validateAccount()
