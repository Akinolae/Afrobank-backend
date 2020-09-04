'use strict';
const {
  customerLogin,
  customerModel,
  fetchUser,
  fetchUsers,
  getBalance,
  pinReset,
  registerCustomer,
  transfer
} = require("./testRequests");

// Call all test suites;
transfer();
customerLogin();
customerModel();
fetchUser();
getBalance();
pinReset();
fetchUsers();
registerCustomer();