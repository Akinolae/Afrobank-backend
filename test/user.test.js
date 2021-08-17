'use strict'
const {
    customerLogin,
    customerModel,
    getBalance,
    registerCustomer,
    transfer,
    validateAccount,
    connectDb,
    // failCustomerLogin,
    // shouldNotRegisterExistingUser,
} = require('./testRequests')

// Call all test suites;
// failCustomerLogin()
transfer()
customerLogin()
customerModel()
getBalance()
registerCustomer()
validateAccount()
// shouldNotRegisterExistingUser()
connectDb()
