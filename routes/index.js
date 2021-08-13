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
const { validateAccount } = require('../services/accountValidation')
const { changePassword } = require('../services/changePassword/changePassword')
const {
    deleteNotification,
} = require('../services/deleteNotification/deleteNotification')

router.get(`/balance/:id`, getAccountBalance)
router.get(`/history/:id`, getTransactionHistory)
router.delete(`/deleteNotification/:index`, deleteNotification)
router.post(`/changePassword`, changePassword)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.post(`/login`, localLogin)
router.post(`/transfer`, transfer)
router.post(`/user`, getUser)
router.post('/validate', validateAccount)

module.exports = router
