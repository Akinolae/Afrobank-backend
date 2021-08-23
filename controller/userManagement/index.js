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
    notifications,
} = require('../../lib/constants')
const { user_reg } = require('../../lib/constants')
const {
    setNewPin,
    updateNotification,
    deleteNotification,
} = require('../../lib/queries')
const {
    sendMail,
    createAccountNumber,
    createPin,
    logError,
} = require('../../utils')
const {
    fetch_single_user,
    login_notify,
    generateUserAccessToken,
    decryptPassword,
    hashPassword,
} = require('../../utils/userUtil')
const { fetchAllNotifications } = require('../../utils/index')

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
        password,
        res
    ) => {
        const accountNumber = await createAccountNumber(this.customer)
        const accountBalance = process.env.DEFAULT_BALANCE
        const pin = createPin()
        const hashedPassword = await hashPassword(password)

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
            password: hashedPassword,
        }
        const joi_validate = authSchema.validate({
            firstName,
            surName,
            lastName,
            email,
            phoneNumber,
            gender,
            password,
        })
        if (!!joi_validate.error) {
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
                await this.createPushNotification(
                    accountNumber,
                    user_reg.welcome_text
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

    login = async (userEmail, userPassword, res) => {
        if (!userEmail || !userPassword) {
            response(
                user_login.credentials,
                false,
                StatusCodes.UNPROCESSABLE_ENTITY,
                res
            )
        } else {
            const data = await fetch_single_user(userEmail)

            if (data.status) {
                const { password, email } = data.message
                const decryptPass = await decryptPassword(
                    userPassword,
                    password
                )

                if (email !== userEmail || !decryptPass) {
                    response(
                        user_login.invalid_credentials,
                        false,
                        StatusCodes.BAD_REQUEST,
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
                    const token = generateUserAccessToken({
                        payload: userData,
                    })

                    response('', true, 200, res, token, userData)
                    sendMail(
                        login_notify(data.message),
                        userData.email,
                        user_login.email_subject,
                        user_login.email_text
                    )
                }
            } else {
                response(data.message, false, StatusCodes.FORBIDDEN, res)
            }
        }
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

    setPin = async (accountNumber, pin, res) => {
        const isValidated = setPinSchema.validate({ accountNumber, pin })
        if (!!isValidated.error) {
            response(
                isValidated.error.message,
                false,
                StatusCodes.UNPROCESSABLE_ENTITY,
                res
            )
        } else {
            try {
                await setNewPin(this.customer, accountNumber, pin)
                response(pinReset.message, true, StatusCodes.OK, res)
            } catch (e) {
                response(e.message, false, StatusCodes.BAD_REQUEST, res)
            }
        }
    }

    createPushNotification = async (accountNumber, message) => {
        await updateNotification(this.customer, accountNumber, message)
    }

    deleteNotification = async (accountNumber, index, res) => {
        try {
            const resp = await deleteNotification(
                this.customer,
                accountNumber,
                index
            )
            if (resp) {
                response(notifications.delete, true, StatusCodes.OK, res)
            } else {
                response(
                    notifications.deleteError,
                    false,
                    StatusCodes.NOT_FOUND,
                    res
                )
            }
        } catch (error) {
            response(error, false, 500, res)
        }

        // await deleteNotification(this.customer, 8101050210, data)
    }

    getNotifications = async (accountNumber, res) => {
        try {
            const data = await fetchAllNotifications(accountNumber)

            if (!data.status) {
                response(data.response, false, StatusCodes.NOT_FOUND, res)
            } else {
                response(data.response, true, StatusCodes.OK, res)
            }
        } catch (e) {
            console.log(e)
        }
    }
    changePassword = async (user, password, res) => {}
}

const user = new UserManagement(model)
Object.freeze(user)
module.exports = user
