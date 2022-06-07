// @params {_customer_} object required;

require('dotenv').config()
const model = require('../../model/customer')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')

const {
  setNewPin,
  createOtp,
  newSchema,
  addNewField,
  getAllUsers,
  updatePassword,
  accountActivation,
  updateNotification,
  deleteNotification,
} = require('../../utils/queries.js')
const {
  createPin,
  createAccountNumber,
  fetchAllNotifications,
  generateUserAccessToken,
} = require('../../utils')
const {
  pinReset,
  user_reg,
  authSchema,
  user_login,
  setPinSchema,
  notifications,
} = require('../../utils/validator')
const {
  isAdmin,
  verifyUser,
  hashPassword,
  decryptPassword,
  fetch_single_user,
  verifyAccountNumber,
} = require('../../utils/userUtil')

class UserManagement {
  constructor(_customer_) {
    this.customer = _customer_
  }

  // #1
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
          err.message.includes('duplicate')
            ? `user already exists`
            : err.message || 'An error occured',
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      }
    }
  }

  // #2
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
            StatusCodes.UNAUTHORIZED,
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
            active,
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
            active,
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

  // #3
  getUser = async (req, res) => {
    try {
      const user = await fetch_single_user(req.body.email)
      const data = await verifyUser(req)
      if (!!data || !user.status) {
        response(
          data || "User doesn't exist" || 'Unable to fetch user',
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        const { firstName, lastName } = user.message
        response({ firstName, lastName }, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #4
  getUsers = async (req, res) => {
    try {
      const data = await verifyUser(req)
      const user = await fetch_single_user(req.params.email)

      if (!!data || !user.status) {
        response(
          data || "User doesn't exist" || 'Unable to fetch user',
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        if (isAdmin(user.message.account)) {
          const resp = await getAllUsers()
          const allUsers = resp.message
            .filter((data) => data.account !== 'admin')
            .map((user) => ({
              accountNumber: user.accountNumber,
              accountBalance: user.accountBalance,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              phoneNumber: user.phoneNumber,
              transactions: user.transactions,
              userId: user._id,
            }))
          response(allUsers, true, StatusCodes.OK, res)
        } else {
          response(
            'You are not authorized to do that',
            false,
            StatusCodes.UNAUTHORIZED,
            res
          )
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #5
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

  // #6
  createPushNotification = async (accountNumber, message) => {
    await updateNotification(this.customer, accountNumber, message)
  }

  activateUser = async (req, res) => {
    try {
      const data = await verifyUser(req)
      const resp = await Promise.allSettled([
        fetch_single_user(req.params.email),
        fetch_single_user(req.body.email),
      ])

      const hasErrors = !!resp.filter((data) => data.value.status === false)
        .length
      if (!!data || !!hasErrors) {
        response(
          data || "Couldn't complete request, check credentials",
          false,
          !!hasErrors
            ? StatusCodes.UNPROCESSABLE_ENTITY
            : StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        if (isAdmin(resp[0].value.message.account)) {
          await accountActivation(req.body.email, true)
          response('account activated successfully', true, StatusCodes.OK, res)
        } else {
          response(
            'You are not authorized to do that',
            false,
            StatusCodes.UNAUTHORIZED,
            res
          )
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #7
  deActivateUser = async (req, res) => {
    try {
      const data = await verifyUser(req)
      const resp = await Promise.allSettled([
        fetch_single_user(req.params.email),
        fetch_single_user(req.body.email),
      ])

      const hasErrors = !!resp.filter((data) => data.value.status === false)
        .length
      if (!!data || !!hasErrors) {
        response(
          data || "Couldn't complete request, check credentials",
          false,
          !!hasErrors
            ? StatusCodes.UNPROCESSABLE_ENTITY
            : StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        if (isAdmin(resp[0].value.message.account)) {
          await accountActivation(req.body.email, false)
          response(
            'account deactivated successfully',
            true,
            StatusCodes.OK,
            res
          )
        } else {
          response(
            'You are not authorized to do that',
            false,
            StatusCodes.UNAUTHORIZED,
            res
          )
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #8
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

  // #9
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

  // #10
  changePassword = async (password, req, res) => {
    try {
      const data = await verifyUser(req)
      if (!!data || !password) {
        response(
          data || 'Password is required',
          false,
          !!data ? StatusCodes.UNAUTHORIZED : StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        const userExists = await fetch_single_user(req.params.email)
        if (userExists.status) {
          const hash = await hashPassword(password)
          const data = await updatePassword(
            this.customer,
            userExists.message.accountNumber,
            hash
          )
          response(data.message, true, StatusCodes.OK, res)
        } else {
          response(userExists.message, false, StatusCodes.NOT_FOUND, res)
        }
      }
    } catch (e) {
      response(e.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #11
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

  // #12
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

  // #13
  createNewField = async () => {
    try {
      await addNewField('active', true)
    } catch (error) {
      console.log(error)
    }
  }
}

const user = new UserManagement(model)
Object.freeze(user)
module.exports = { user, UserManagement }
