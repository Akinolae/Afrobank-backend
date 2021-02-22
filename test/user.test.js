'use strict';
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
  validateAccount
} = require("./testRequests");

// Call all test suites;
sendEmail();
transfer();
customerLogin();
customerModel();
getBalance();
pinReset();
fetchUsers();
registerCustomer();
validateAccount()