const router = require('express').Router()
const { transfer } = require('../services/cashTransfer/cashtransfer')
const { register } = require('../services/Register/register')
const { getAccountBalance } = require('../services/getBalance/getBalance')
const { getUser, getAllUsers } = require('../services/getUsers/getUsers')
const { localLogin } = require('../services/login/localLogin')
const {
  getTransactionHistory,
  getSingleTransaction,
} = require('../services/transactionHistory/getTransactionHistory')
const { pinReset, createPin } = require('../services/pin/pinreset')
const { validateAccount } = require('../services/accountValidation')
const {
  changePassword,
  forgotPassword,
  sendOtp,
} = require('../services/changePassword/index')
const {
  deleteNotification,
  fetchAllNotifications,
} = require('../services/notifications')
const { addNewFieldToDb } = require('../services/dbUpdate')
const { activateAccount, deactivateAccount } = require('../services/account')

router.delete(`/deleteNotification/`, deleteNotification)
router.get(`/balance/:id`, getAccountBalance)
router.get(`/history/:id`, getTransactionHistory)
router.get('/notifications/:id', fetchAllNotifications)
router.get(`/transaction/`, getSingleTransaction)
router.get(`/user/:email`, getUser)
router.get(`/getAllUsers/:email`, getAllUsers)
router.patch(`/createpin/:email`, createPin)
router.patch(`/forgotPassword`, forgotPassword)
router.patch(`/changePassword`, changePassword)
router.patch(`/acivate/:email`, activateAccount)
router.patch(`/deactivate/:email`, deactivateAccount)
router.post('/newField', addNewFieldToDb)
router.post(`/sendOtp`, sendOtp)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.post(`/login`, localLogin)
router.post(`/transfer/:email`, transfer)
router.post('/validate', validateAccount)

module.exports = router
