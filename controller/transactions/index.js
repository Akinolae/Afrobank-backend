require('dotenv').config()

const model = require('../../model/customer')
const { sendMail, isPinValid, logError } = require('../../utils')
const { transactionHistory } = require('../../utils/transactionsUtil')
const { verifyAccountNumber } = require('../../utils/userUtil')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction } = require('../../lib/queries')
const { transfer, transferAuthSchema } = require('../../lib/constants')
const { redisSet, redisGet } = require('../../utils/redisUtil')

class Transactions {
    constructor(_customer_) {
        this.customer = _customer_
    }

    transfer = async (sender, recipient, amount, pin, res) => {
        const joi_error = transferAuthSchema.validate({
            sender,
            recipient,
            amount,
            pin,
        })
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
                const isRecipientValid = await verifyAccountNumber(recipient)

                if (
                    isRecipientValid.status &&
                    isSenderValid.status &&
                    !!isSenderValid.user &&
                    !!isRecipientValid.user
                ) {
                    if (!isPinValid(isSenderValid.user.pin, pin)) {
                        response(
                            transfer.pinError,
                            false,
                            StatusCodes.UNPROCESSABLE_ENTITY,
                            res
                        )
                    } else {
                        if (Number(isSenderValid.user.accountBalance) <= 0) {
                            response(
                                transfer.low_balance,
                                false,
                                StatusCodes.UNPROCESSABLE_ENTITY,
                                res
                            )
                        } else if (
                            Number(amount) >
                            Number(isSenderValid.user.accountBalance)
                        ) {
                            response(
                                transfer.insufficient_balance,
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
                                recipientName: `${isRecipientValid.user.surName} ${isRecipientValid.user.firstName} ${isRecipientValid.user.lastName}`,
                                amount,
                                type: 'debit',
                            }
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
                logError('/logs/transfer.txt', error)
                throw error || 'An error occured'
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
                if (!!senderResp && !!recipientResp) {
                    response(
                        transfer.success_message(recipientName, amount),
                        true,
                        StatusCodes.OK,
                        res
                    )
                }
            }
        } catch (error) {
            const errResp = error
            logError('completeTransfer.txt', error)
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
            logError('/logs/getTransactionHistory.txt', error)
            response(error, false, StatusCodes.BAD_REQUEST, res)
        }
    }
}

const userTransactions = new Transactions(model)
Object.freeze(userTransactions)

module.exports = userTransactions
