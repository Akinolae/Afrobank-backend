require('dotenv').config()

const model = require('../../model/customer')
const transactions = require('../../model/transactions')
const virtualAccount = require('../../model/virtualAccounts')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction } = require('../../utils/queries')
const { verifyAccountNumber } = require('../../utils/userUtil')
const { transactionHistory, trxCore } = require('../../utils/transactionsUtil')
const { transfer, transferAuthSchema } = require('../../utils/validator')
class Transactions {
  constructor(_customer_, _transactions_, _virtualAccount_) {
    this.customer = _customer_
    this.transactions = _transactions_
    this.virtualAccount = _virtualAccount_
  }

  transfer = async (req, res) => {
    const joi_error = transferAuthSchema.validate(req.body)

    const [senderDetails, recipientDetails] = await Promise.all([
      verifyAccountNumber(req.body.sender),
      verifyAccountNumber(req.body.recipient),
    ])

    try {
      const hasError =
        !!joi_error.error ||
        !senderDetails.status ||
        !recipientDetails.status ||
        senderDetails.user.pin === null

      if (hasError) {
        response(
          !!joi_error.error
            ? joi_error.error.details[0].message
            : !senderDetails.status
            ? senderDetails.message
            : !recipientDetails.status
            ? recipientDetails.message
            : senderDetails.user.pin === null
            ? 'Please create a pin to proceed'
            : transfer.single_user,
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        try {
          await trxCore({
            user: senderDetails.user,
            trxPin: req.body.pin,
            amount: req.body.amount,
          })

          const transactionData = {
            senderAccountNumber: senderDetails.user.accountNumber,
            recipientAccountNumber: recipientDetails.user.accountNumber,
            recipientName: `${recipientDetails.user.firstName} ${recipientDetails.user.lastName}`,
            senderName: `${senderDetails.user.firstName} ${senderDetails.user.lastName}`,
            amount: req.body.amount,
            type: 'debit',
            sender_id: senderDetails.user.user_id,
            recipient_id: recipientDetails.user.user_id,
            senderDetails,
            recipientDetails,
          }

          this.completeTransfer(transactionData, res)
        } catch (error) {
          response(error, false, StatusCodes.UNPROCESSABLE_ENTITY, res)
        }
      }
    } catch (error) {
      response(
        error.message || 'An error occured',
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        res
      )
    }
  }

  completeTransfer = async (payload, res) => {
    const {
      type,
      senderAccountNumber,
      recipientAccountNumber,
      amount,
      recipientName,
      senderName,
      sender_id,
      recipient_id,
      senderDetails,
      recipientDetails,
    } = payload

    if (!type) {
      throw 'transaction type is required'
    }
    try {
      if (type === 'debit') {
        const senderDesc = `TRX-INTERNAL/${recipientName ?? ''}`
        const recipientDesc = `TRX-INTERNAL/${senderName ?? ''}`
        const [sender, recipient] = await Promise.all([
          this.updateTransactionHistory(
            type,
            senderAccountNumber,
            amount,
            senderDesc,
            sender_id,
            senderDetails
          ),
          this.updateTransactionHistory(
            'credit',
            recipientAccountNumber,
            amount,
            recipientDesc,
            recipient_id,
            recipientDetails
          ),
        ])

        !!sender &&
          !!recipient &&
          response(transfer.success_message(amount), true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  updateTransactionHistory = async (
    type,
    accountNumber,
    amount,
    description,
    user_id,
    accountDetails
  ) => {
    return await updateTransaction({
      _type_: type,
      _accountNumber: accountNumber,
      _amount_: amount,
      _description_: description,
      user_id,
      accountDetails,
    })
  }

  getTransactionHistory = async (req, res) => {
    try {
      const data = await transactionHistory(req.query?.account, res.user)

      !data.status
        ? response(data.response, false, StatusCodes.NOT_FOUND, res)
        : response(data.response, true, StatusCodes.OK, res)
    } catch (error) {
      response(error, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getSingleTransaction = async (req, res) => {
    const { accountNumber, transaction_id } = req.query
    try {
      if (!accountNumber || !transaction_id) {
        response(
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
      response(error.message, false, StatusCodes.BAD_REQUEST, res)
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
