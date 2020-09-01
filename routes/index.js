const router = require("express").Router();

const transaction = require('../services/cashTransfer/cashtransfer')
const userReg = require("../services/Register/register");
const userBalance = require("../services/getBalance/getBalance");
const getUser = require("../services/getUsers/getUsers");
const localLogin = require("../services/login/localLogin");
const transactionHistory = require("../services/transactionHistory/getTransactionHistory");
const pinReset = require("../services/pinreset/pinreset");


router.post(`/register`, userReg.register);

// Login user
router.post(`/login`, localLogin.localLogin);

// money transfer;
router.post(`/transfer`, transaction.transfer);

// Pin reset
router.post(`/pinreset`, pinReset.pinReset);

// Checks for the available balance of that specific user.
router.get(`/balance/:id`, userBalance.getAccountBalance);

// returns the data of a current user
router.post(`/user`, getUser.getUser);
// deletes a particular user;
router.get(`/delete/:id`);
// returns all users/customers/account
router.get(`/users`, getUser.getUsers);
// returns the transaction history of a particular user
router.get(`/history/:id`, transactionHistory.getTransactionHistory);

module.exports = router;
