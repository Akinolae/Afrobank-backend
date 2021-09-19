const router = require('express').Router()
const path = require('path')
const { transfer } = require('../services/cashTransfer/cashtransfer')
const { register } = require('../services/Register/register')
const { getAccountBalance } = require('../services/getBalance/getBalance')
const { getUser } = require('../services/getUsers/getUsers')
const { localLogin } = require('../services/login/localLogin')
const {
    getTransactionHistory,
} = require('../services/transactionHistory/getTransactionHistory')
const { pinReset, createPin } = require('../services/pin/pinreset')
const { validateAccount } = require('../services/accountValidation')
const { changePassword } = require('../services/changePassword/changePassword')
const {
    deleteNotification,
    fetchAllNotifications,
} = require('../services/notifications')

router.get(`/`, (req, res) => {
    res.send(`<div style="display: flex; justify-content: center; font-family: sans-serif; align-content: center; margin: 20% auto;">
        <h3>Your Afrobank server is running</h3>
    </div>`)
})
router.delete(`/deleteNotification/`, deleteNotification)
router.get(`/balance/:id`, getAccountBalance)
router.get(`/history/:id`, getTransactionHistory)
router.get('/notifications/:id', fetchAllNotifications)
router.patch(`/createpin`, createPin)
router.post(`/changePassword`, changePassword)
router.post(`/pinreset`, pinReset)
router.post(`/register`, register)
router.post(`/login`, localLogin)
router.post(`/transfer`, transfer)
router.post(`/user`, getUser)
router.post('/validate', validateAccount)

module.exports = router
