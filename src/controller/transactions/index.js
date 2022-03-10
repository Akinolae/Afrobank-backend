require('dotenv').config()

const model = require('../../model/customer')
const { isPinValid, validateAmount } = require('../../utils')
const { transactionHistory } = require('../../utils/transactionsUtil')
const { verifyAccountNumber, verifyUser } = require('../../utils/userUtil')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction } = require('../../utils/queries')
const { transfer, transferAuthSchema, token } = require('../../utils/validator')
const customer = require('../userManagement/index')

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
        if (!!data) {
            response(data, false, StatusCodes.UNAUTHORIZED, res)
        } else {
            if (!!joi_error.error) {
                response(
                    joi_error.error.details[0].message,
                    false,
                    StatusCodes.UNPROCESSABLE_ENTITY,
                    res
                )
            } else if (sender === recipient) {
                response(
                    transfer.single_user,
                    false,
                    StatusCodes.UNPROCESSABLE_ENTITY,
                    res
                )
            } else {
                try {
                    const isSenderValid = await verifyAccountNumber(sender)
                    const isRecipientValid = await verifyAccountNumber(
                        recipient
                    )
                    const valRes = validateAmount(isSenderValid.user, amount)
                    const pinValidation =
                        !isSenderValid.user.pin ||
                        !(await isPinValid(pin, isSenderValid.user.pin))

                    if (
                        isRecipientValid.status &&
                        isSenderValid.status &&
                        !!isSenderValid.user &&
                        !!isRecipientValid.user
                    ) {
                        if (pinValidation) {
                            response(
                                transfer.pinError,
                                false,
                                StatusCodes.UNPROCESSABLE_ENTITY,
                                res
                            )
                        } else {
                            if (!!valRes) {
                                response(
                                    valRes,
                                    false,
                                    StatusCodes.UNPROCESSABLE_ENTITY,
                                    res
                                )
                            } else {
                                const transactionData = {
                                    senderAccountNumber:
                                        isSenderValid.user.accountNumber,
                                    recipientAccountNumber:
                                        isRecipientValid.user.accountNumber,
                                    recipientName: `${isRecipientValid.user.firstName} ${isRecipientValid.user.lastName}`,
                                    amount,
                                    type: 'debit',
                                }
                                const notifyRecipient = `${isSenderValid.user.firstName} ${isSenderValid.user.lastName} just sent you ₦${transactionData.amount}`
                                const notifySender = `you just sent ₦${transactionData.amount} to ${transactionData.recipientName}`
                                await customer.createPushNotification(
                                    isSenderValid.user.accountNumber,
                                    notifySender
                                )
                                await customer.createPushNotification(
                                    isRecipientValid.user.accountNumber,
                                    notifyRecipient
                                )
                                this.completeTransfer(transactionData, res)
                            }
                        }
                    } else if (!isRecipientValid.status) {
                        response(
                            `${isRecipientValid.message} of recipient`,
                            false,
                            StatusCodes.NOT_FOUND,
                            res
                        )
                    } else if (!isSenderValid.status) {
                        response(
                            `${isSenderValid.message} of sender`,
                            false,
                            StatusCodes.NOT_FOUND,
                            res
                        )
                    }
                } catch (error) {
                    throw error || 'An error occured'
                }
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
        } = payload

        if (!type) {
            throw 'transaction type is required'
        }
        try {
            if (type === 'debit') {
                const senderResp = await this.updateTransactionHistory(
                    type,
                    senderAccountNumber,
                    amount
                )
                const recipientResp = await this.updateTransactionHistory(
                    'credit',
                    recipientAccountNumber,
                    amount
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
            response(errResp, false, StatusCodes.BAD_REQUEST, res)
        }
    }

    updateTransactionHistory = async (type, accountNumber, amount) => {
        return await updateTransaction(
            this.customer,
            type,
            accountNumber,
            amount
        )
    }

    getTransactionHistory = async (accountNumber, res) => {
        try {
            const data = await transactionHistory(accountNumber)

            if (!data.status) {
                response(data.response, false, StatusCodes.NOT_FOUND, res)
            } else {
                response(data.response, true, StatusCodes.OK, res)
            }
        } catch (error) {
            response(error, false, StatusCodes.BAD_REQUEST, res)
        }
    }

    getSingleTransaction = async (accountNumber, transaction_Id, res) => {
        if (!!accountNumber && !!transaction_Id) {
            try {
                const data = await transactionHistory(accountNumber)
                if (!!data.status) {
                    const resp = data.response.find(
                        (trx) =>
                            trx.transaction_id.toLowerCase() ===
                            transaction_Id.toLowerCase()
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
            } catch (error) {
                response(error, false, StatusCodes.BAD_REQUEST, res)
            }
        } else {
            response(
                'requires account number and transaction id',
                false,
                StatusCodes.NOT_FOUND,
                res
            )
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
            response(error, false, StatusCodes.BAD_REQUEST)
        }
    }
}

const userTransactions = new Transactions(model)
Object.freeze(userTransactions)

module.exports = userTransactions
