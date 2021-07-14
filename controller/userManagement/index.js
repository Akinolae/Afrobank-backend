// @params {_customer_} object required;

require('dotenv').config()
const model = require('../../model/customer')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const {
    authSchema,
    user_login,
    setPinSchema,
    pinReset,
} = require('../../lib/constants')
const { user_reg } = require('../../lib/constants')
const { sendMail, createAccountNumber, createPin } = require('../../utils')
const {
    fetch_single_user,
    login_notify,
    generateUserAccessToken,
} = require('../../utils/userUtil')

class UserManagement {
    constructor(_customer_) {
        this.customer = _customer_
    }

    register = async (
        firstName,
        lastName,
        surName,
        email,
        phoneNumber,
        gender,
        res
    ) => {
        const accountNumber = await createAccountNumber(this.customer)
        const accountBalance = process.env.DEFAULT_BALANCE
        const pin = createPin()

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
                StatusCodes.UNPROCESSABLE_ENTITY,
                res
            )
        } else {
            try {
                let user_model = await new this.customer(user)
                await user_model.save()
                sendMail(
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
                    StatusCodes.OK,
                    res
                )
            } catch (err) {
                response(
                    `user with email ${email} already exists`,
                    false,
                    StatusCodes.UNPROCESSABLE_ENTITY,
                    res
                )
            }
        }
    }

    login = async (accountNumber, firstName, res) => {
        if (!accountNumber || !firstName) {
            response({
                message: user_login.credentials,
                success: false,
                code: StatusCodes.UNPROCESSABLE_ENTITY,
                res: res,
            })
        } else {
            const data = await fetch_single_user(accountNumber)
            if (
                data.message.accountNumber !== accountNumber &&
                data.message.firstName !== firstName
            ) {
                response(
                    user_login.invalid_credentials,
                    false,
                    StatusCodes.FORBIDDEN,
                    res
                )
            } else {
                const userData = {
                    userId: data.message.id,
                    firstName: data.message.firstName,
                    surName: data.message.surName,
                    lastName: data.message.lastName,
                    email: data.message.email,
                    accountNumber: data.message.accountNumber,
                }
                const token = generateUserAccessToken({ payload: userData })
                response('', true, 200, res, token, userData)
                sendMail(
                    login_notify(data.message),
                    userData.email,
                    user_login.email_subject,
                    user_login.email_text
                )
            }
        }
    }

    getUsers = async (res) => {
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

    getUser = async (accountNumber, res) => {
        const user = await fetch_single_user(accountNumber)
        const user_details = {
            firstname: user.message.firstName,
            surname: user.message.surName,
            lastName: user.message.lastName,
        }
        user.status
            ? response(user_details, true, StatusCodes.OK, res)
            : response(user.message, false, StatusCodes.NOT_FOUND, res)
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

    setPin = async (accountNumber, pin, res) => {
        const isValidated = setPinSchema.validate({ accountNumber, pin })
        if (isValidated.error) {
            response(
                isValidated.error.message,
                false,
                StatusCodes.UNPROCESSABLE_ENTITY,
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
                                StatusCodes.OK,
                                res
                            )
                            sendMail(
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
                                StatusCodes.UNPROCESSABLE_ENTITY,
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
}

const user = new UserManagement(model)
Object.freeze(user)
module.exports = user
