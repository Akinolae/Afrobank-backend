require('dotenv').config()

const model = require('../../model/customer')
const { sendMail, isPinValid, transactionHistory } = require('../../utils')
const { verifyAccountNumber } = require('../../utils/userUtil')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { calc_account_balance, updateTransaction } = require('../../lib/queries')
const { transfer, transferAuthSchema } = require('../../lib/constants')

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
                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                res
            )
        } else if (sender === recipient) {
            response(
                transfer.single_user,
                false,
                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
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

                            this.completeTransfer(transactionData)
                            response(
                                transfer.success_message,
                                true,
                                StatusCodes.OK,
                                res
                            )
                        }
                    }
                } else if (!isRecipientValid.status) {
                    response(
                        `Recipient ${isRecipientValid.message}`,
                        false,
                        StatusCodes.UNPROCESSABLE_ENTITY,
                        res
                    )
                } else if (!isSenderValid.status) {
                    response(
                        `Sender ${isSenderValid.message}`,
                        false,
                        StatusCodes.UNPROCESSABLE_ENTITY,
                        res
                    )
                }
            } catch (error) {
                throw error || 'An error occured'
            }
        }
    }

    getBalance = async (accountNumber, res) => {
        calc_account_balance(accountNumber)
        // !data.status
        //     ? response(data.message, false, StatusCodes.BAD_REQUEST, res)
        //     : response(data, true, StatusCodes.OK, res)
    }

    completeTransfer = async (payload) => {
        const {
            type,
            senderAccountNumber,
            recipientAccountNumber,
            amount,
            recipientName,
        } = payload
        console.log(payload)
        if (type === 'debit') {
            this.updateTransactionHistory(type, senderAccountNumber, amount)
            this.updateTransactionHistory(
                'credit',
                recipientAccountNumber,
                amount
            )
        }
    }

    updateTransactionHistory = async (type, accountNumber, amount) => {
        await updateTransaction(this.customer, type, accountNumber, amount)
    }

    getTransactionHistory = async (accountNumber, res) => {
        try {
            const data = await transactionHistory(accountNumber)
            if (!data.status) {
                response(data.response, false, StatusCodes.OK, res)
            } else {
                response(data.response, true, StatusCodes.BAD_REQUEST, res)
            }
        } catch (error) {
            response(error, false, StatusCodes.BAD_REQUEST, res)
        }
    }
}

const userTransactions = new Transactions(model)
Object.freeze(userTransactions)

module.exports = userTransactions
