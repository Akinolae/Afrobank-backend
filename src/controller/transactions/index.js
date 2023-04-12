require('dotenv').config()
const model = require('../../model/customer')
const transactions = require('../../model/transactions')
const virtualAccount = require('../../model/virtualAccounts')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { verifyAccountNumber } = require('../../utils/userUtil')
const { transactionHistory, trxCore } = require('../../utils/transactionsUtil')
const { transfer, transferAuthSchema } = require('../../utils/validator')
const banks = require('../../lib/banks.json')

class Transactions {
  constructor(_customer_, _transactions_, _virtualAccount_) {
    this.customer = _customer_
    this.transactions = _transactions_
    this.virtualAccount = _virtualAccount_
    this.isInternalTrx = false
  }

  transfer = async (req, res) => {
    const joi_error = transferAuthSchema.validate(req.body)

    const [senderDetails, recipientDetails] = await Promise.all([
      verifyAccountNumber(req.body.sender),
      verifyAccountNumber(req.body.recipient),
    ])

    try {
      const hasError =
        !!joi_error.error || !senderDetails.status || !recipientDetails.status

      if (hasError) {
        response(
          !!joi_error.error
            ? joi_error.error.details[0].message
            : !senderDetails.status
            ? senderDetails.message
            : !recipientDetails.status
            ? recipientDetails.message
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
        accountDetails: senderDetails,
      }

      const recipientData = {
        type: 'credit',
        accountNumber: recipientDetails.user.accountNumber,
        amount: req.body.amount,
        description: `TRX-INTERNAL`,
        user_id: recipientDetails.user.user_id,
        accountDetails: recipientDetails,
      }

      await trxCore({
        user: senderDetails.user,
        trxPin: req.body.pin,
        amount: req.body.amount,
        bank_name: req.body.bank_name,
        trxData: [senderData, recipientData],
      })

      response(
        transfer.success_message(req.body.amount),
        true,
        StatusCodes.OK,
        res
      )
    } catch (error) {
      response(
        error || error.message || 'An error occured',
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
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
}

const userTransactions = new Transactions(model, transactions, virtualAccount)
Object.freeze(userTransactions)

module.exports = userTransactions
