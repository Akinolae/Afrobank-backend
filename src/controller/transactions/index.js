require('dotenv').config()

const model = require('../../model/customer')
const transactions = require('../../model/transactions')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction } = require('../../utils/queries')
const { transactionHistory } = require('../../utils/transactionsUtil')
const { validateAmount } = require('../../utils')
const { transfer, transferAuthSchema } = require('../../utils/validator')
const {
  verifyAccountNumber,
  verifyUser,
  decryptPassword,
} = require('../../utils/userUtil')

class Transactions {
  constructor(_customer_, _transactions_) {
    this.customer = _customer_
    this.transactions = _transactions_
  }

  transfer = async (req, res) => {
    const joi_error = transferAuthSchema.validate(req.body)

    const [senderDetails, recipientDetails] = await Promise.all([
      verifyAccountNumber(req.body.sender),
      verifyAccountNumber(req.body.recipient),
    ])

    const [verify, pinValidation] = await Promise.all([
      verifyUser({
        email: senderDetails.status ? senderDetails.user.email : '',
        req: req,
      }),

      decryptPassword(
        req.body.pin,
        senderDetails.status ? senderDetails.user.pin : ''
      ),
    ])

    if (
      !!verify ||
      !!joi_error.error ||
      !senderDetails.status ||
      !recipientDetails.status
    ) {
      response(
        !!verify
          ? verify
          : !!joi_error.error
          ? joi_error.error.details[0].message
          : !senderDetails.status
          ? senderDetails.message
          : !recipientDetails.status
          ? recipientDetails.message
          : transfer.single_user,
        false,
        !!verify ? StatusCodes.UNAUTHORIZED : StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
    } else {
      try {
        const valRes = validateAmount(senderDetails.user, req.body.amount)

        if (!pinValidation || !!valRes) {
          response(
            !pinValidation ? transfer.pinError : valRes,
            false,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          const transactionData = {
            senderAccountNumber: senderDetails.user.accountNumber,
            recipientAccountNumber: recipientDetails.user.accountNumber,
            recipientName: `${recipientDetails.user.firstName} ${recipientDetails.user.lastName}`,
            senderName: `${senderDetails.user.firstName} ${senderDetails.user.lastName}`,
            amount: req.body.amount,
            type: 'debit',
            user_id: senderDetails.user._id,
            recipient_id: recipientDetails.user._id,
          }

          this.completeTransfer(transactionData, res)
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
  }

  completeTransfer = async (payload, res) => {
    const {
      type,
      senderAccountNumber,
      recipientAccountNumber,
      amount,
      recipientName,
      senderName,
      user_id,
      recipient_id,
    } = payload

    if (!type) {
      throw 'transaction type is required'
    }
    try {
      if (type === 'debit') {
        const senderDesc = `TRX-INTERNAL/${recipientName}`
        const recipientDesc = `TRX-INTERNAL/${senderName}`
        const [sender, recipient] = await Promise.all([
          this.updateTransactionHistory(
            type,
            senderAccountNumber,
            amount,
            senderDesc,
            user_id
          ),
          this.updateTransactionHistory(
            'credit',
            recipientAccountNumber,
            amount,
            recipientDesc,
            recipient_id
          ),
        ])

        !!sender &&
          !!recipient &&
          response(
            transfer.success_message(recipientName, amount),
            true,
            StatusCodes.OK,
            res
          )
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
    user_id
  ) => {
    return await updateTransaction(
      this.customer,
      this.transactions,
      type,
      accountNumber,
      amount,
      description,
      user_id
    )
  }

  getTransactionHistory = async (req, res) => {
    try {
      const [verify, data] = await Promise.all([
        verifyUser({ email: '', req: req }),
        transactionHistory(req.params.id),
      ])

      if (!!verify || !data.status) {
        response(
          !!verify ? verify : data.response,
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      } else {
        response(data.response, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getSingleTransaction = async (accountNumber, transaction_Id, res) => {
    try {
      if (!!accountNumber && !!transaction_Id) {
        const data = await transactionHistory(accountNumber)
        if (!!data.status) {
          const resp = data.response.find(
            (trx) =>
              trx.transaction_id.toLowerCase() === transaction_Id.toLowerCase()
          )
          !!resp
            ? response(resp, true, StatusCodes.OK, res)
            : response(
                'invalid transaction id',
                false,
                StatusCodes.NOT_FOUND,
                res
              )
        }
      } else {
        response(
          'requires account number and transaction id',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      }
    } catch (error) {
      response(error.message, false, StatusCodes.BAD_REQUEST, res)
    }
  }

  getBalance = async (accountNumber, res) => {
    try {
      const data = await verifyAccountNumber(accountNumber)
      if (data.status) {
        response(data.user.accountBalance, true, StatusCodes.OK, res)
      } else {
        response(data.message, false, StatusCodes.NOT_FOUND, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const userTransactions = new Transactions(model, transactions)
Object.freeze(userTransactions)

module.exports = userTransactions
