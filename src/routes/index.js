const router = require('express').Router()
const { transfer, getBankList } = require('../services/cashtransfer')
const { register, confirmSignUp } = require('../services/register')
const { localLogin } = require('../services/localLogin')
const { addNewFieldToDb } = require('../services/dbUpdate')
const { validateAccount } = require('../services/accountValidation')
const { getAccountBalance } = require('../services/getBalance')
const { pinReset, createPin } = require('../services/pinreset')
const {
  getUser,
  getProfile,
  addAfriend,
  verifyToken,
  getAllUsers,
  getNewToken,
  getFriendsList,
  getFriendAccount,
} = require('../services/getUsers')
const {
  activateAccount,
  generateAccountNumber,
} = require('../services/account')
const {
  getSingleTransaction,
  getTransactionHistory,
} = require('../services/getTransactionHistory')
const {
  changePassword,
  forgotPassword,
  forgotPasswordCodeVerification,
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
  resetPin,
  sendMoney,
  createCard,
  fetchCards,
  updateCardStatus,
  fetchCardTransactions,
} = require('../services/cards/cardsService')
const { verifyUser } = require('../utils/userUtil')

// === {GET}/ request ===
router.get(`/user/:email`, getUser)
router.get(`/bankList`, getBankList)
router.get(`/new-token`, getNewToken)
router.get(`/getProfile`, getProfile)
router.get(`/userCards`, verifyUser, fetchCards)
router.get(`/friends`, verifyUser, getFriendsList)
router.get(`/getAllUsers`, verifyUser, getAllUsers)
router.get(`/balance`, verifyUser, getAccountBalance)
router.get('/notifications/:id', fetchAllNotifications)
router.get(`/history`, verifyUser, getTransactionHistory)
router.get(`/friend-account`, verifyUser, getFriendAccount)
router.get(`/transaction/`, verifyUser, getSingleTransaction)
router.get(`/generate-account`, verifyUser, generateAccountNumber)
router.get(`/card-transactions`, verifyUser, fetchCardTransactions)

// === {POST}/ request ===
router.post(`/login`, localLogin)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.post(`/verify-token`, verifyToken)
router.post('/newField', addNewFieldToDb)
router.post('/validate', validateAccount)
router.post('/confirmSignUp', confirmSignUp)
router.post(`/transfer/`, verifyUser, transfer)
router.post(`/sendMoney`, verifyUser, sendMoney)
router.post(`/add-friend`, verifyUser, addAfriend)
router.post('/createCard', verifyUser, createCard)
router.post('/validate2fa', verifyUser, validate2fa)
router.post(`/verify-code`, forgotPasswordCodeVerification)

// === {PATCH}/ request ===
router.patch(`/forgotPassword`, forgotPassword)
router.patch(`/enable2fa`, verifyUser, enable2fa)
router.patch(`/createpin`, verifyUser, createPin)
router.patch(`/disable2fa`, verifyUser, disable2fa)
router.patch(`/reset-card-pin`, verifyUser, resetPin)
router.patch(`/activate`, verifyUser, activateAccount)
router.patch(`/new2FAcodes`, verifyUser, requestCodes)
router.patch(`/deactivatel`, verifyUser, activateAccount)
router.patch(`/changePassword`, verifyUser, changePassword)
router.patch(`/update-status`, verifyUser, updateCardStatus)

// === {DELETE}/ request ===
router.delete(`/deleteNotification/`, deleteNotification)

module.exports = router
