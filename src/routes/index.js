const router = require('express').Router()
const { transfer } = require('../services/cashTransfer/cashtransfer')
const { register } = require('../services/Register/register')
const { localLogin } = require('../services/login/localLogin')
const { addNewFieldToDb } = require('../services/dbUpdate')
const { validateAccount } = require('../services/accountValidation')
const { getAccountBalance } = require('../services/getBalance/getBalance')
const { pinReset, createPin } = require('../services/pin/pinreset')
const {
  getUser,
  getAllUsers,
  getProfile,
} = require('../services/getUsers/getUsers')
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
const {
  enable2fa,
  disable2fa,
  validate2fa,
  requestCodes,
} = require('../services/2fa')

router.post(`/sendOtp`, sendOtp)
router.post(`/login`, localLogin)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.get(`/user/:email`, getUser)
router.post('/validate', validateAccount)
router.post(`/transfer/:email`, transfer)
router.post('/newField', addNewFieldToDb)
router.post('/validate2fa/:email', validate2fa)
router.patch(`/createpin/:email`, createPin)
router.get(`/balance/:id`, getAccountBalance)
router.get(`/getAllUsers/:email`, getAllUsers)
router.get(`/getProfile/:email`, getProfile)
router.patch(`/changePassword/:email`, changePassword)
router.patch(`/forgotPassword`, forgotPassword)
router.patch(`/activate/:email`, activateAccount)
router.patch(`/enable2fa/:email`, enable2fa)
router.patch(`/disable2fa/:email`, disable2fa)
router.get(`/history/:id`, getTransactionHistory)
router.get(`/transaction/`, getSingleTransaction)
router.patch(`/deactivate/:email`, activateAccount)
router.patch(`/new2FAcodes/:email`, requestCodes)
router.get('/notifications/:id', fetchAllNotifications)
router.delete(`/deleteNotification/`, deleteNotification)

module.exports = router
