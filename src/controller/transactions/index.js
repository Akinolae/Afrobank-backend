require('dotenv').config()

const model = require('../../model/customer')
const { user } = require('../userManagement/index')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction } = require('../../utils/queries')
const { transactionHistory } = require('../../utils/transactionsUtil')
const { redisGet, redisSet } = require('../../utils/redisUtil')
const { validateAmount } = require('../../utils')
const { transfer, transferAuthSchema } = require('../../utils/validator')
const {
  verifyAccountNumber,
  verifyUser,
  decryptPassword,
} = require('../../utils/userUtil')

class Transactions {
  constructor(_customer_) {
    this.customer = _customer_
  }

  transfer = async (sender, recipient, amount, pin, req, res) => {
    const joi_error = transferAuthSchema.validate({
      sender,
      recipient,
      amount,
      pin,
    })

    const [senderDetails, recipientDetails] = await Promise.all([
      verifyAccountNumber(sender),
      verifyAccountNumber(recipient),
    ])
    const verify = await verifyUser({
      email: senderDetails.user.email,
      req: req,
    })

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
        const userPin = senderDetails.user.pin
        const valRes = validateAmount(senderDetails.user, amount)
        const pinValidation = await decryptPassword(pin, userPin)

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
            amount,
            type: 'debit',
          }
          const notifyRecipient = `${senderDetails.user.firstName} ${senderDetails.user.lastName} just sent you ₦${transactionData.amount}`
          const notifySender = `you just sent ₦${transactionData.amount} to ${transactionData.recipientName}`
          await user.createPushNotification(
            senderDetails.user.accountNumber,
            notifySender
          )
          await user.createPushNotification(
            recipientDetails.user.accountNumber,
            notifyRecipient
          )
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
            senderDesc
          ),
          this.updateTransactionHistory(
            'credit',
            recipientAccountNumber,
            amount,
            recipientDesc
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
    description
  ) => {
    return await updateTransaction(
      this.customer,
      type,
      accountNumber,
      amount,
      description
    )
  }

  getTransactionHistory = async (accountNumber, res) => {
    try {
      const data = await transactionHistory(accountNumber)

      if (!data.status) {
        response(data.response, false, StatusCodes.NOT_FOUND, res)
      } else {
        await redisSet('trx', data.response)
        const val = redisGet('trx')
        response(val, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error, false, StatusCodes.BAD_REQUEST, res)
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

const userTransactions = new Transactions(model)
Object.freeze(userTransactions)

module.exports = userTransactions
