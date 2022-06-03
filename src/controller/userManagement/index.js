// @params {_customer_} object required;

require('dotenv').config()
const model = require('../../model/customer')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')

const {
  setNewPin,
  updateNotification,
  deleteNotification,
  createOtp,
  updatePassword,
  newSchema,
  addNewField,
} = require('../../utils/queries.js')
const {
  createAccountNumber,
  createPin,
  fetchAllNotifications,
  generateUserAccessToken,
} = require('../../utils')
const {
  user_reg,
  authSchema,
  user_login,
  setPinSchema,
  pinReset,
  notifications,
} = require('../../utils/validator')
const {
  fetch_single_user,
  decryptPassword,
  hashPassword,
  verifyAccountNumber,
  verifyUser,
} = require('../../utils/userUtil')

class UserManagement {
  constructor(_customer_) {
    this.customer = _customer_
  }

  register = async (params, res) => {
    const { firstName, lastName, email, phoneNumber, gender, password } = params
    const accountNumber = await createAccountNumber(this.customer)
    const accountBalance = process.env.DEFAULT_BALANCE
    const hashedPassword = await hashPassword(password)

    const user = {
      firstName,
      lastName,
      email,
      phoneNumber,
      gender,
      accountNumber,
      accountBalance,
      password: hashedPassword,
    }
    const joi_validate = authSchema.validate({
      firstName,
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
        response(user_reg.resp_msg_registration, true, StatusCodes.OK, res)
        await this.createPushNotification(accountNumber, user_reg.welcome_text)
      } catch (err) {
        response(
          `user already exists`,
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
      const data = await fetch_single_user(userEmail.trim())

      if (data.status) {
        const { password, email } = data.message
        if (
          email !== userEmail.trim() ||
          !(await decryptPassword(userPassword.trim(), password))
        ) {
          response(
            user_login.invalid_credentials,
            false,
            StatusCodes.BAD_REQUEST,
            res
          )
        } else {
          const {
            id,
            firstName,
            lastName,
            email,
            accountNumber,
            pin,
            accountBalance,
            account,
          } = data.message

          const userData = {
            id,
            firstName,
            lastName,
            email,
            accountNumber,
            pin,
            accountBalance,
            account,
          }

          const token = generateUserAccessToken(userData)
          await newSchema({
            model: this.customer,
            email,
            payload: token,
          })

          response({ ...userData, token }, true, 200, res)
        }
      } else {
        response(data.message, false, StatusCodes.FORBIDDEN, res)
      }
    }
  }

  getUser = async (accountNumber, res, req) => {
    const user = await verifyAccountNumber(accountNumber)
    const data = await verifyUser(req)
    if (!!data) {
      response(data, false, StatusCodes.UNAUTHORIZED, res)
    }
    if (!!user.status) {
      const user_details = {
        id: user.user._id,
        firstName: user.user.firstName,
        lastName: user.user.lastName,
        email: user.user.email,
        accountNumber: user.user.accountNumber,
        pin: user.user.pin,
        accountBalance: user.user.accountBalance,
        token: user.user.token,
      }
      response(user_details, true, StatusCodes.OK, res)
    } else {
      response(user.message, false, StatusCodes.NOT_FOUND, res)
    }
  }

  // #12

  setPin = async (accountNumber, pin, req, res) => {
    const isValidated = setPinSchema.validate({ accountNumber, pin })
    const data = await verifyUser(req)
    if (!!data) {
      response(data, false, StatusCodes.UNAUTHORIZED, res)
    }

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
      const resp = await deleteNotification(this.customer, accountNumber, index)
      if (resp) response(notifications.delete, true, StatusCodes.OK, res)
      else
        response(notifications.deleteError, false, StatusCodes.NOT_FOUND, res)
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

  changePassword = async (accountNumber, password, res) => {
    if (!!accountNumber && !!password) {
      try {
        const userExists = await verifyAccountNumber(accountNumber)
        if (!!userExists.status) {
          const hash = await hashPassword(password)
          const data = await updatePassword(this.customer, accountNumber, hash)
          response(data.message, true, StatusCodes.OK, res)
        } else {
          response(userExists.message, false, StatusCodes.NOT_FOUND, res)
        }
      } catch (error) {
        console.log(error)
      }
    } else {
      response(
        'Kindly enter required fields',
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
    }
  }

  sendPasswordOtp = async (email, res) => {
    const code = createPin(5)
    const otp = await hashPassword(code)
    const userExists = await fetch_single_user(email)
    if (!!userExists.status) {
      try {
        const data = await createOtp(this.customer, email, otp)
        response(data.message, data.status, StatusCodes.OK, res)
      } catch (error) {
        throw error
      }
    } else {
      response(userExists.message, false, StatusCodes.NOT_FOUND, res)
    }
  }

  forgotPassword = async (accountNumber, pin, res) => {
    if (!!accountNumber && !!pin) {
      try {
        const userExists = await verifyAccountNumber(accountNumber)
        if (!!userExists.status) {
          const { otp } = userExists.user
          const isValidOtp = await decryptPassword(pin, otp)
          if (!!isValidOtp) {
            response('Please reset your password', true, StatusCodes.OK, res)
          } else {
            response('Invalid otp', false, StatusCodes.BAD_REQUEST, res)
          }
        } else {
          response(userExists.message, false, StatusCodes.NOT_FOUND, res)
        }
      } catch (error) {
        response(error, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
      }
    } else {
      response(
        'Kindly enter required fields',
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
    }
  }

  createNewField = async () => {
    try {
      await addNewField('account', 'user')
    } catch (error) {
      console.log(error)
    }
  }
}

const user = new UserManagement(model)
Object.freeze(user)
module.exports = user
