const router = require('express').Router()
const { transfer } = require('../services/cashtransfer')
const { register } = require('../services/register')
const { localLogin } = require('../services/localLogin')
const { addNewFieldToDb } = require('../services/dbUpdate')
const { validateAccount } = require('../services/accountValidation')
const { getAccountBalance } = require('../services/getBalance')
const { pinReset, createPin } = require('../services/pinreset')
const { getUser, getAllUsers, getProfile } = require('../services/getUsers')
const { activateAccount } = require('../services/account')
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
const { createCard, fetchCards } = require('../services/cards/cardsService')
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
router.get(`/getProfile`, verifyUser, getProfile)
router.patch(`/enable2fa`, verifyUser, enable2fa)
router.patch(`/createpin`, verifyUser, createPin)
router.get(`/transaction/`, getSingleTransaction)
router.post('/createCard', verifyUser, createCard)
router.get(`/getAllUsers`, verifyUser, getAllUsers)
router.patch(`/disable2fa`, verifyUser, disable2fa)
router.post('/validate2fa', verifyUser, validate2fa)
router.patch(`/activate`, verifyUser, activateAccount)
router.patch(`/new2FAcodes`, verifyUser, requestCodes)
router.get('/notifications/:id', fetchAllNotifications)
router.get(`/history/:id/:email`, getTransactionHistory)
router.patch(`/deactivatel`, verifyUser, activateAccount)
router.patch(`/changePassword`, verifyUser, changePassword)
router.delete(`/deleteNotification/`, deleteNotification)

module.exports = router
