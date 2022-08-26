'use strict'
const {
  customerLogin,
  customerModel,
  getBalance,
  registerCustomer,
  transfer,
  validateAccount,
  connectDb,
  verifyUserEmail,
  fetchTransactionHistory,
  fetchAllNotifications,
  calculateAccountBalance,
  createPin,
  failCustomerLogin,
  shouldNotRegisterExistingUser,
  // createAccountNumber,
  // shouldNotRegisterExistingUser,
} = require('./testRequests')

// Call all test suites;
failCustomerLogin()
// createAccountNumber()
createPin()
calculateAccountBalance()
fetchAllNotifications()
fetchTransactionHistory()
transfer()
customerLogin()
customerModel()
getBalance()
registerCustomer()
validateAccount()
verifyUserEmail()
shouldNotRegisterExistingUser()
connectDb()
