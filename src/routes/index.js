const router = require('express').Router()
const { transfer } = require('../services/cashtransfer')
const { register } = require('../services/register')
const { localLogin } = require('../services/localLogin')
const { addNewFieldToDb } = require('../services/dbUpdate')
const { validateAccount } = require('../services/accountValidation')
const { getAccountBalance } = require('../services/getBalance')
const { pinReset, createPin } = require('../services/pinreset')
const { getUser, getAllUsers, getProfile } = require('../services/getUsers')
const {
  activateAccount,
  generateAccountNumber,
} = require('../services/account')
const {
  getTransactionHistory,
  getSingleTransaction,
} = require('../services/getTransactionHistory')
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
} = require('../services/2FA')
const {
  createCard,
  fetchCards,
  sendMoney,
  resetPin,
  updateCardStatus,
  fetchCardTransactions,
} = require('../services/cards/cardsService')
const { verifyUser } = require('../utils/userUtil')

router.post(`/login`, localLogin)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.get(`/user/:email`, getUser)
router.post('/newField', addNewFieldToDb)
router.post('/validate', validateAccount)
router.post(`/sendOtp`, verifyUser, sendOtp)
router.get(`/balance/:id`, getAccountBalance)
router.patch(`/forgotPassword`, forgotPassword)
router.post(`/transfer/`, verifyUser, transfer)
router.get(`/userCards`, verifyUser, fetchCards)
router.post(`/sendMoney`, verifyUser, sendMoney)
router.get(`/getProfile`, verifyUser, getProfile)
router.patch(`/enable2fa`, verifyUser, enable2fa)
router.patch(`/createpin`, verifyUser, createPin)
router.get(`/transaction/`, verifyUser, getSingleTransaction)
router.post('/createCard', verifyUser, createCard)
router.get(`/getAllUsers`, verifyUser, getAllUsers)
router.patch(`/disable2fa`, verifyUser, disable2fa)
router.post('/validate2fa', verifyUser, validate2fa)
router.patch(`/reset-card-pin`, verifyUser, resetPin)
router.patch(`/activate`, verifyUser, activateAccount)
router.patch(`/new2FAcodes`, verifyUser, requestCodes)
router.get(`/card-transactions`, verifyUser, fetchCardTransactions)
router.get('/notifications/:id', fetchAllNotifications)
router.get(`/history`, verifyUser, getTransactionHistory)
router.patch(`/deactivatel`, verifyUser, activateAccount)
router.delete(`/deleteNotification/`, deleteNotification)
router.patch(`/changePassword`, verifyUser, changePassword)
router.patch(`/update-status`, verifyUser, updateCardStatus)
router.get(`/generate-account`, verifyUser, generateAccountNumber)

module.exports = router
