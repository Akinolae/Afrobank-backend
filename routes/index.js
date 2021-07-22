const router = require('express').Router()
const { transfer } = require('../services/cashTransfer/cashtransfer')
const { register } = require('../services/Register/register')
const { getAccountBalance } = require('../services/getBalance/getBalance')
const { getUser } = require('../services/getUsers/getUsers')
const { localLogin } = require('../services/login/localLogin')
const {
    getTransactionHistory,
} = require('../services/transactionHistory/getTransactionHistory')
const { pinReset } = require('../services/pinreset/pinreset')
const { ussdTransaction } = require('../services/ussd/ussd')
const { validateAccount } = require('../services/accountValidation')

router.get(`/balance/:id`, getAccountBalance)
router.get(`/history/:id`, getTransactionHistory)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.post(`/login`, localLogin)
router.post(`/transfer`, transfer)
router.post(`/user`, getUser)
router.post(`/`, ussdTransaction)
router.post('/validate', validateAccount)

module.exports = router
