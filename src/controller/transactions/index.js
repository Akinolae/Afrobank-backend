require('dotenv').config()
const model = require('../../model/customer')
const transactions = require('../../model/transactions')
const virtualAccount = require('../../model/virtualAccounts')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const {
  verifyAccountNumber,
  fetch_single_user,
} = require('../../utils/userUtil')
const { transactionHistory, trxCore } = require('../../utils/transactionsUtil')
const { transfer, transferAuthSchema } = require('../../utils/validator')
const banks = require('../../lib/banks.json')
const errorUtil = require('../../utils/errorUtil')
const { getAllUsers } = require('../../services/getUsers')
const { user } = require('../userManagement/index')

class Transactions {
  constructor(_customer_, _transactions_, _virtualAccount_) {
    this.customer = _customer_
    this.transactions = _transactions_
    this.virtualAccount = _virtualAccount_
    this.isInternalTrx = false
    this.user = user
  }

  transfer = async (req, res) => {
    const joi_error = transferAuthSchema.validate(req.body)
    const senderDetails = await verifyAccountNumber(req.body.sender)

    try {
      const hasError = !!joi_error.error || !senderDetails.status

      if (hasError) {
        response(
          !!joi_error.error
            ? joi_error.error.details[0].message
            : !senderDetails.status
            ? senderDetails.message
            : transfer.single_user,
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      }

      const senderData = {
        type: 'debit',
        accountNumber: senderDetails.user.accountNumber,
        amount: req.body.amount,
        description: `TRX-INTERNAL`,
        user_id: senderDetails.user.user_id,
        account_id: senderDetails.user.account_id,
        bank_name: req.body.bank_name,
      }

      const recipientData = {
        type: 'credit',
        accountNumber: req.body.recipient,
        amount: req.body.amount,
        description: `TRX-INTERNAL`,
        bank_name: req.body.bank_name,
      }

      await trxCore({
        user: senderDetails.user,
        trxPin: req.body.pin,
        amount: req.body.amount,
        trxData: [senderData, recipientData],
      })

      response(
        transfer.success_message(req.body.amount),
        true,
        StatusCodes.OK,
        res
      )
    } catch (error) {
      response(errorUtil(error), false, StatusCodes.UNPROCESSABLE_ENTITY, res)
    }
  }

  getBankList = async (req, res) => {
    response(banks, true, StatusCodes.OK, res)
  }

  getTransactionHistory = async (req, res) => {
    try {
      const data = await transactionHistory(req.query?.account, res.user)

      if (data.status) {
        throw response(data.response, false, StatusCodes.NOT_FOUND, res)
      }
      response(data.response, true, StatusCodes.OK, res)
    } catch (error) {
      throw response(error, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getSingleTransaction = async (req, res) => {
    const { accountNumber, transaction_id } = req.query
    try {
      if (!accountNumber || !transaction_id) {
        throw response(
          'requires account number and transaction id',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const data = await transactionHistory(+accountNumber, res.user)

        if (data.status) {
          const resp = data.response.find(
            (trx) => trx.transaction_id === transaction_id
          )
          !!resp
            ? response(resp, true, StatusCodes.OK, res)
            : response(
                'transaction not found',
                false,
                StatusCodes.NOT_FOUND,
                res
              )
        }
      }
    } catch (error) {
      throw response(error.message, false, StatusCodes.BAD_REQUEST, res)
    }
  }

  getBalance = async (accountNumber, res) => {
    try {
      const data = await verifyAccountNumber(accountNumber)
      data.status
        ? response(data.user.accountBalance, true, StatusCodes.OK, res)
        : response(data.message, false, StatusCodes.NOT_FOUND, res)
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getFriendAccount = async (req, res) => {
    try {
      const { id } = req.query
      const userData = await fetch_single_user(res.user.email)
      if (!userData.status || !id) {
        !id ? 'Invalid user id' : userData.message,
          false,
          StatusCodes.BAD_REQUEST,
          res
      } else {
        console.log(this.user.friendsCore(userData.message.friends))
      }
    } catch (error) {}
  }
}

const userTransactions = new Transactions(model, transactions, virtualAccount)
Object.freeze(userTransactions)

module.exports = userTransactions
