require('dotenv').config()

const model = require('../../model/customer')
const { user } = require('../userManagement/index')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction } = require('../../utils/queries')
const { transactionHistory } = require('../../utils/transactionsUtil')
const { redisGet, redisSet } = require('../../utils/redisUtil')
const { isPinValid, validateAmount } = require('../../utils')
const { transfer, transferAuthSchema } = require('../../utils/validator')
const { verifyAccountNumber, verifyUser } = require('../../utils/userUtil')

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

    const data = await verifyUser(req)
    if (!!data || !!joi_error.error || sender === recipient) {
      response(
        !!data
          ? data
          : !!joi_error.error
          ? joi_error.error.details[0].message
          : transfer.single_user,
        false,
        !!data ? StatusCodes.UNAUTHORIZED : StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
    } else {
      try {
        const resp = await Promise.allSettled([
          verifyAccountNumber(sender),
          verifyAccountNumber(recipient),
        ])

        const hasErrors = !!resp.filter((data) => data.value.status === false)
          .length
        const invalidSenderAcc =
          typeof resp[0].value.message === 'string' ? resp[0].value.message : ''
        const invalidRecipientAcc =
          typeof resp[1].value.message === 'string' ? resp[1].value.message : ''

        if (hasErrors) {
          response(
            invalidSenderAcc || invalidRecipientAcc,
            false,
            StatusCodes.NOT_FOUND,
            res
          )
        } else {
          const userPin = resp[0].value.user.pin
          const valRes = validateAmount(resp[0].value.user, amount)
          const pinValidation = !userPin || !(await isPinValid(pin, userPin))

          if (pinValidation) {
            response(
              transfer.pinError,
              false,
              StatusCodes.UNPROCESSABLE_ENTITY,
              res
            )
          } else {
            if (!!valRes) {
              response(valRes, false, StatusCodes.UNPROCESSABLE_ENTITY, res)
            } else {
              const transactionData = {
                senderAccountNumber: resp[0].value.user.accountNumber,
                recipientAccountNumber: resp[0].value.user.accountNumber,
                recipientName: `${resp[1].value.user.firstName} ${resp[1].value.user.lastName}`,
                senderName: `${resp[0].value.user.firstName} ${resp[0].value.user.lastName}`,
                amount,
                type: 'debit',
              }
              const notifyRecipient = `${resp[0].value.user.firstName} ${resp[0].value.user.lastName} just sent you ₦${transactionData.amount}`
              const notifySender = `you just sent ₦${transactionData.amount} to ${transactionData.recipientName}`
              await user.createPushNotification(
                resp[0].value.user.accountNumber,
                notifySender
              )
              await user.createPushNotification(
                resp[1].value.user.accountNumber,
                notifyRecipient
              )
              this.completeTransfer(transactionData, res)
            }
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

        const senderResp = await this.updateTransactionHistory(
          type,
          senderAccountNumber,
          amount,
          senderDesc
        )
        const recipientResp = await this.updateTransactionHistory(
          'credit',
          recipientAccountNumber,
          amount,
          recipientDesc
        )
        !!senderResp &&
          !!recipientResp &&
          response(
            transfer.success_message(recipientName, amount),
            true,
            StatusCodes.OK,
            res
          )
      }
    } catch (error) {
      response(errpr.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
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
