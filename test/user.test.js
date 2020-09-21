'use strict';
const {
  customerLogin,
  customerModel,
  fetchUser,
  fetchUsers,
  getBalance,
  pinReset,
  registerCustomer,
  transfer,
  sendEmail,
  sendText
} = require("./testRequests");

// Call all test suites;
sendEmail();
sendText();
transfer();
customerLogin();
customerModel();
fetchUser();
getBalance();
pinReset();
fetchUsers();
registerCustomer();