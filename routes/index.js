const router = require("express").Router();
const {transfer, completeTransfer} = require('../services/cashTransfer/cashtransfer')
const {register} = require("../services/Register/register");
const {getAccountBalance} = require("../services/getBalance/getBalance");
const {getUsers, getUser} = require("../services/getUsers/getUsers");
const {localLogin} = require("../services/login/localLogin");
const {getTransactionHistory} = require("../services/transactionHistory/getTransactionHistory");
const {pinReset} = require("../services/pinreset/pinreset");
const {deleteCustomer} = require("../services/deleteCustomer/deleteCustomer");
const {ussdTransaction} = require("../services/ussd/ussd");
const {validateAccount} = require("../services/accountValidation")


router.post(`/register`, register);
router.post(`/login`, localLogin);
router.post(`/transfer`, transfer);
router.post(`/pinreset`, pinReset);
router.get(`/balance/:id`, getAccountBalance);
router.post(`/user`, getUser);
router.post(`/completeTransfer`, completeTransfer);
router.get(`/delete/:id`, deleteCustomer);
router.get(`/users`, getUsers);
router.post(`/`,ussdTransaction);
router.get(`/history/:id`, getTransactionHistory);
router.post('/validate', validateAccount)

module.exports = router;
