const router = require('express').Router()
const { transfer } = require('../services/cashTransfer/cashtransfer')
const { register } = require('../services/Register/register')
const { localLogin } = require('../services/login/localLogin')
const { addNewFieldToDb } = require('../services/dbUpdate')
const { validateAccount } = require('../services/accountValidation')
const { getAccountBalance } = require('../services/getBalance/getBalance')
const { pinReset, createPin } = require('../services/pin/pinreset')
const { getUser, getAllUsers } = require('../services/getUsers/getUsers')
const { activateAccount, deactivateAccount } = require('../services/account')
const {
  getTransactionHistory,
  getSingleTransaction,
} = require('../services/transactionHistory/getTransactionHistory')
const {
  sendOtp,
  changePassword,
  forgotPassword,
} = require('../services/changePassword/index')
const {
  deleteNotification,
  fetchAllNotifications,
} = require('../services/notifications')

router.post(`/sendOtp`, sendOtp)
router.post(`/login`, localLogin)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.get(`/user/:email`, getUser)
router.post('/validate', validateAccount)
router.post(`/transfer/:email`, transfer)
router.post('/newField', addNewFieldToDb)
router.patch(`/createpin/:email`, createPin)
router.get(`/balance/:id`, getAccountBalance)
router.get(`/getAllUsers/:email`, getAllUsers)
router.patch(`/changePassword/:email`, changePassword)
router.patch(`/forgotPassword`, forgotPassword)
router.patch(`/acivate/:email`, activateAccount)
router.get(`/history/:id`, getTransactionHistory)
router.get(`/transaction/`, getSingleTransaction)
router.patch(`/deactivate/:email`, deactivateAccount)
router.get('/notifications/:id', fetchAllNotifications)
router.delete(`/deleteNotification/`, deleteNotification)

module.exports = router
