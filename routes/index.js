const router = require("express").Router();
const {transfer} = require('../services/cashTransfer/cashtransfer')
const {register} = require("../services/Register/register");
const {getAccountBalance} = require("../services/getBalance/getBalance");
const {getUsers, getUser} = require("../services/getUsers/getUsers");
const {localLogin} = require("../services/login/localLogin");
const {getTransactionHistory} = require("../services/transactionHistory/getTransactionHistory");
const {pinReset} = require("../services/pinreset/pinreset");


router.post(`/register`, register);
router.post(`/login`, localLogin);
router.post(`/transfer`, transfer);
router.post(`/pinreset`, pinReset);
router.get(`/balance/:id`, getAccountBalance);
router.post(`/user`, getUser);
router.get(`/delete/:id`);
router.get(`/users`, getUsers);
router.get(`/history/:id`, getTransactionHistory);

module.exports = router;
