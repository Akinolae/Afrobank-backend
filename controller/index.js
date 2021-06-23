require('dotenv').config()

const { response } = require('./responseHandler')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const statusCode = require('http-status-codes')
const messages = require('./data')
const { calc_account_balance, fetch_single_user } = require('../lib/queries')
const { generate_account_no } = require('./data')
const model = require('../model/customer')
const {
    user_login,
    user_reg,
    authSchema,
    otp_messsage,
    setPinSchema,
    pinReset,
    completeTransactionSchema,
    completeTransfer,
    transferAuthSchema,
    transfer,
} = require('../lib/constants')

class Customer {
    constructor(_customer) {
        this.customer = _customer
    }
    // #1
    register = async (
        firstName,
        lastName,
        surName,
        email,
        phoneNumber,
        gender,
        res
    ) => {
        // CREATES VIRTUAL ACCOUNT NUMBERS AND DEFAULT PINS
        const accountNumber = generate_account_no()
        const accountBalance = process.env.DEFAULT_BALANCE
        const pin = otpGenerator.generate(4, {
            alphabets: false,
            digits: true,
            specialChars: false,
            upperCase: false,
        })

        const user = {
            firstName,
            surName,
            lastName,
            email,
            phoneNumber,
            gender,
            accountNumber,
            accountBalance,
            pin,
        }
        const joi_validate = authSchema.validate({
            firstName,
            surName,
            lastName,
            email,
            phoneNumber,
            gender,
        })
        if (joi_validate.error) {
            response(
                joi_validate.error.details[0].message,
                false,
                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                res
            )
        } else {
            try {
                let user_model = await new this.customer(user)
                await user_model.save()
                this.sendMail(
                    user_reg.emailTemplate(
                        firstName,
                        pin,
                        accountBalance,
                        accountNumber
                    ),
                    email,
                    user_reg.reg_mail_subject,
                    user_reg.reg_mail_text
                )
                response(
                    user_reg.resp_msg_registration,
                    true,
                    statusCode.StatusCodes.OK,
                    res
                )
            } catch (err) {
                response(
                    user_reg.registration_error,
                    false,
                    statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                    res
                )
            }
        }
    }

    // #2
    // returns the account balance of the specified user.
    getBalance = async (accountNumber, res) => {
        const data = await calc_account_balance(accountNumber)
        !data.status
            ? response(
                  data.message,
                  false,
                  statusCode.StatusCodes.BAD_REQUEST,
                  res
              )
            : response(data, true, statusCode.StatusCodes.OK, res)
    }

    // #3
    // returns all users in the scope
    getUsers(res) {
        this.customer
            .findAll({
                raw: true,
            })
            .then((resp) => {
                const respMsg = 'No customer to display'
                resp.length === 0
                    ? response(respMsg, false, 404, res)
                    : response(resp, true, 200, res)
            })
            .catch((err) => {
                response(err, false, 400, res)
            })
    }

    // #4
    login = async (accountNumber, firstName, res) => {
        if (!accountNumber || !firstName) {
            response(
                user_login.credentials,
                false,
                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                res
            )
        } else {
            const data = await fetch_single_user(accountNumber)
            if (
                data.message.accountNumber !== accountNumber &&
                data.message.firstName !== firstName
            ) {
                response(
                    user_login.invalid_credentials,
                    false,
                    statusCode.StatusCodes.FORBIDDEN,
                    res
                )
            } else {
                response(
                    user_login.login_success,
                    true,
                    200,
                    res,
                    null,
                    data.message
                )
                this.sendMail(
                    messages.login_notify(data.message),
                    data.message.email,
                    user_login.email_subject,
                    user_login.email_text
                )
            }
        }
    }
    // #5
    getUser = async (accountNumber, res) => {
        const user = await fetch_single_user(accountNumber)
        const user_details = {
            firstname: user.message.firstName,
            surname: user.message.surName,
            lastName: user.message.lastName,
        }
        user.status
            ? response(user_details, true, statusCode.StatusCodes.OK, res)
            : response(
                  user.message,
                  false,
                  statusCode.StatusCodes.NOT_FOUND,
                  res
              )
    }

    // #6
    setPin = async (accountNumber, pin, res) => {
        const isValidated = setPinSchema.validate({ accountNumber, pin })
        if (isValidated.error) {
            response(
                isValidated.error.message,
                false,
                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                res
            )
        } else {
            try {
                const user = await fetch_single_user(accountNumber)
                if (user.status) {
                    await this.customer
                        .updateOne(
                            { accountNumber: user.message.accountNumber },
                            { $set: { pin: pin } }
                        )
                        .then(() => {
                            response(
                                pinReset.message,
                                true,
                                statusCode.StatusCodes.OK,
                                res
                            )
                            this.sendMail(
                                pinReset.emailTemplate(user.message.firstName),
                                user.message.email,
                                'Afrobank pin reset',
                                'pin'
                            )
                        })
                        .catch((err) => {
                            response(
                                pinReset.error,
                                true,
                                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                                res
                            )
                        })
                } else {
                    console.log(user.status)
                }
            } catch (err) {
                throw err || 'Something went wrong'
            }
        }
    }

    transfer = async (sender, recipient, amount, pin, res) => {
        const joi_error = transferAuthSchema.validate({
            sender,
            recipient,
            amount,
            pin,
        })
        if (joi_error.error) {
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
                    if (isSenderValid.message.pin !== pin) {
                        response(
                            transfer.pinError,
                            false,
                            statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                            res
                        )
                    } else {
                        if (isSenderValid.message.accountBalance <= 0) {
                            response(
                                transfer.low_balance,
                                false,
                                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                                res
                            )
                        } else if (
                            amount > isSenderValid.message.accountBalance
                        ) {
                            response(
                                transfer.insufficient_balance,
                                false,
                                statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                                res
                            )
                        } else {
                            this.completeTransfer(isSenderValid.message)
                            this.sendOtp(isSenderValid.message)
                            response(
                                transfer.success_message,
                                true,
                                statusCode.StatusCodes.OK,
                                res
                            )
                        }
                    }
                } else if (!isRecipientValid.status) {
                    response(
                        `Recipient ${isRecipientValid.message}`,
                        false,
                        statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                        res
                    )
                } else if (!isSenderValid.status) {
                    response(
                        `Sender ${isSenderValid.message}`,
                        false,
                        statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
                        res
                    )
                }
            } catch (error) {
                throw error || 'An error occured'
            }
        }
    }
    // #7
    completeTransfer = async (payload) => {
        const { pin } = payload
        console.log(pin)
        // const name = "Akinola";
        // const newBuff = new Buffer.alloc(10, name).toString("base64");
        // console.log(newBuff);
        // if (typeof amount === 'string') {
        //     response(
        //         completeTransfer.invalidAmount,
        //         false,
        //         statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
        //         res
        //     )
        // }
        // else {
        //     const isValidated = completeTransactionSchema.validate({
        //         sender,
        //         recipient,
        //         amount,
        //         otp,
        //     })
        //     if (isValidated.error) {
        //         response(
        //             isValidated.error.message,
        //             false,
        //             statusCode.StatusCodes.UNPROCESSABLE_ENTITY,
        //             res
        //         )
        //     } else {
        //         try {
        //             const senderData = await fetch_single_user(sender)
        //             const recipientData = await fetch_single_user(recipient)
        //             if (recipientData.status && senderData.status) {
        //                 const isOtpValid =
        //                     senderData.message.otp === parseInt(otp)
        //                 if (isOtpValid) {
        //                     const newRecipientBalance =
        //                         amount + recipientData.message.accountBalance
        //                     const newSenderBalance =
        //                         senderData.message.accountBalance - amount
        //                     // updates sender profile accordingly
        //                     this.customer
        //                         .updateOne(
        //                             { accountNumber: sender },
        //                             {
        //                                 $set: {
        //                                     accountBalance: newSenderBalance,
        //                                     otp: null,
        //                                 },
        //                             }
        //                         )
        //                         .then(() => {
        //                             response(
        //                                 completeTransfer.message(
        //                                     amount,
        //                                     recipientData.message.surName,
        //                                     recipientData.message.firstName,
        //                                     recipientData.message.lastName
        //                                 ),
        //                                 true,
        //                                 statusCode.StatusCodes.OK,
        //                                 res
        //                             )
        //                             this.sendMail(
        //                                 completeTransfer.senderTemplate(
        //                                     senderData.message.firstName,
        //                                     senderData.message.surName,
        //                                     senderData.message.lastName,
        //                                     recipient,
        //                                     recipientData.message.firstName,
        //                                     recipientData.message.surName,
        //                                     recipientData.message.lastName,
        //                                     amount,
        //                                     newSenderBalance
        //                                 ),
        //                                 senderData.message.email,
        //                                 'Debit',
        //                                 'Debit'
        //                             )
        //                         })
        //                         .catch((err) => {
        //                             response(
        //                                 completeTransfer.unsuccessful,
        //                                 false,
        //                                 statusCode.StatusCodes.BAD_REQUEST,
        //                                 res
        //                             )
        //                         })
        //                     // update recipient profile accordingly
        //                     this.customer
        //                         .updateOne(
        //                             { accountNumber: recipient },
        //                             {
        //                                 $set: {
        //                                     accountBalance: newRecipientBalance,
        //                                 },
        //                             }
        //                         )
        //                         .then(() => {
        //                             this.sendMail(
        //                                 completeTransfer.recipientTemplate(
        //                                     recipientData.message.firstName,
        //                                     recipientData.message.lastName,
        //                                     recipientData.message.surName,
        //                                     amount,
        //                                     newRecipientBalance,
        //                                     senderData.message.firstName,
        //                                     senderData.message.lastName,
        //                                     senderData.message.surName
        //                                 ),
        //                                 recipientData.message.email,
        //                                 'Credit alert',
        //                                 'credit'
        //                             )
        //                         })
        //                 } else {
        //                     response(
        //                         completeTransfer.invalidOtp,
        //                         false,
        //                         statusCode.StatusCodes.FORBIDDEN,
        //                         res
        //                     )
        //                 }
        //             } else {
        //                 response(
        //                     completeTransfer.invalidCredentials,
        //                     false,
        //                     statusCode.StatusCodes.FORBIDDEN,
        //                     res
        //                 )
        //             }
        //         } catch (err) {
        //             throw err || 'An error occured'
        //         }
        //     }
        // }
    }

    // #8
    updateOtp = async (accountNumber) => {
        setTimeout(() => {
            this.customer.updateOne(
                { accountNumber: accountNumber },
                { $set: { otp: null } }
            )
        }, 900000)
    }

    // #10
    sendMail = async (message, recipient, subject, text) => {
        async function main() {
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL, // Specific gmail account which can be found in the confi
                    pass: process.env.EMAIL_PASSWORD, // Specific gmail account which can be found in the co
                },
                tls: {
                    rejectUnauthorized: false,
                },
            })
            let info = await transporter.sendMail({
                from: `Afrobank ${process.env.EMAIL}`, // sender address
                to: recipient, //reciever address that was gotten from the frontend/client
                subject: subject,
                text: text,
                html: message,
            })
            console.log('Message sent: %s', info.messageId)
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
        }
        main()
    }
    // #11
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

    // #12
    deleteCustomer = async (accountNo, res) => {
        this.sequelize.sync().then(() => {
            this.customer
                .destroy({
                    raw: true,
                    where: {
                        accountNumber: accountNo,
                    },
                })
                .then((resp) => {
                    const msg = "Customer doesn't exist."
                    const confMsg = 'Customer deleted'
                    resp === 0
                        ? response(msg, false, 400, res)
                        : response(confMsg, true, 200, res)
                })
                .catch(() => {
                    const msg = 'Unable to delete customer.'
                    response(msg, false, 400, res)
                })
        })
    }

    // #13
    sendOtp = async (payload) => {
        const { accountNumber, email, firstName } = payload
        try {
            const otp = otpGenerator.generate(5, {
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
                    this.sendMail(
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
}

const user = new Customer(model)
Object.freeze(user)

module.exports = user
