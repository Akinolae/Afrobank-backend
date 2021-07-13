require('dotenv').config()

const model = require('../../model/customer')
const { generate } = require('otp-generator')
const { sendMail, validatePin } = require('../../utils')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { fetch_single_user, calc_account_balance } = require('../../lib/queries')
const {
    transfer,
    transferAuthSchema,
    otp_messsage,
} = require('../../lib/constants')

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
                const isSenderValid = await fetch_single_user(sender)
                const isRecipientValid = await fetch_single_user(recipient)

                if (
                    isRecipientValid.status &&
                    isSenderValid.status &&
                    !!isSenderValid.message &&
                    !!isRecipientValid.message
                ) {
                    if (!validatePin(isSenderValid.message.pin, pin)) {
                        response(
                            transfer.pinError,
                            false,
                            StatusCodes.UNPROCESSABLE_ENTITY,
                            res
                        )
                    } else {
                        if (Number(isSenderValid.message.accountBalance) <= 0) {
                            response(
                                transfer.low_balance,
                                false,
                                StatusCodes.UNPROCESSABLE_ENTITY,
                                res
                            )
                        } else if (
                            Number(amount) >
                            Number(isSenderValid.message.accountBalance)
                        ) {
                            response(
                                transfer.insufficient_balance,
                                false,
                                StatusCodes.UNPROCESSABLE_ENTITY,
                                res
                            )
                        } else {
                            this.completeTransfer(isSenderValid.message)
                            this.sendOtp(isSenderValid.message)
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
        const data = await calc_account_balance(accountNumber)
        !data.status
            ? response(data.message, false, StatusCodes.BAD_REQUEST, res)
            : response(data, true, StatusCodes.OK, res)
    }

    sendOtp = async (payload) => {
        const { accountNumber, email, firstName } = payload
        try {
            const otp = generate(5, {
                alphabets: false,
                digits: true,
                specialChars: false,
                upperCase: false,
            })
            await this.customer
                .updateOne(
                    { accountNumber: accountNumber },
                    { $set: { otp: otp } }
                )
                .then(() => {
                    sendMail(
                        otp_messsage.template(firstName, otp),
                        email,
                        otp_messsage.subject,
                        otp_messsage.text
                    )
                    this.updateOtp(accountNumber)
                })
                .catch((err) => {
                    throw err
                })
        } catch (err) {
            throw err
        }
    }

    completeTransfer = async (payload) => {
        // const { pin } = payload
        console.log(payload)
    }

    updateTransactionHistory = async (type, acctNo, transactionHistory) => {
        this.sequelize.sync().then(() => {
            transactionHistory
                .update(
                    {
                        transactionType: type,
                        accountNumber: 1234,
                    },
                    {
                        where: {
                            accountNumber: acctNo,
                        },
                    }
                )
                .then(() => {})
                .catch((err) => {
                    throw err
                })
        })
    }

    updateOtp = async (accountNumber) => {
        setTimeout(() => {
            this.customer.updateOne(
                { accountNumber: accountNumber },
                { $set: { otp: null } }
            )
        }, 900000)
    }
}

const userTransactions = new Transactions(model)
Object.freeze(userTransactions)

module.exports = userTransactions
