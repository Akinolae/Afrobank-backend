// @params {_customer_} object required;

require('dotenv').config()
const model = require('../../model/customer')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')

const {
  update2fa,
  setNewPin,
  createOtp,
  newSchema,
  addNewField,
  getAllUsers,
  update2faCodes,
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
    try {
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
          if (
            data.message.email !== userEmail.trim() ||
            !(await decryptPassword(userPassword.trim(), data.message.password))
          ) {
            response(
              user_login.invalid_credentials,
              false,
              StatusCodes.UNAUTHORIZED,
              res
            )
          } else {
            const token = generateUserAccessToken(data.message.id)
            await newSchema({
              model: this.customer,
              email: data.message.email,
              payload: token,
            })

            response({ token }, true, 200, res)
          }
        } else {
          response(data.message, false, StatusCodes.FORBIDDEN, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
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
    try {
      const data = await verifyUser(req)
      if (!!data || !!isValidated.error) {
        response(
          data || isValidated.error.message,
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        await setNewPin(this.customer, accountNumber, pin)
        response(pinReset.message, true, StatusCodes.OK, res)
      }
    } catch (e) {
      response(e.message, false, StatusCodes.BAD_REQUEST, res)
    }
  }

  // #6
  createPushNotification = async (accountNumber, message) => {
    await updateNotification(this.customer, accountNumber, message)
  }

  // #7
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

  // #8
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

  // #9
  deleteNotification = async (accountNumber, index, res) => {
    try {
      const resp = await deleteNotification(this.customer, accountNumber, index)
      if (resp) response(notifications.delete, true, StatusCodes.OK, res)
      else
        response(notifications.deleteError, false, StatusCodes.NOT_FOUND, res)
    } catch (error) {
      response(error, false, 500, res)
    }
  }

  // #10
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

  // #11
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

  // #12
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

  // #13
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

  // #14
  createNewField = async () => {
    try {
      await addNewField('2faEnabled', false)
    } catch (error) {
      console.log(error)
    }
  }

  // #15
  enable2fa = async (req, res) => {
    const length = 5
    let codes = []
    for (var i = 0; i <= length; i++) {
      const code = createPin(6)
      codes.push(code)
    }
    try {
      const data = await verifyUser(req)
      const user = await fetch_single_user(req.params.email)
      if (!!data || !user.status) {
        response(
          data || 'Invalid email address provided',
          false,
          !!data ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        await update2fa(req.params.email, true, codes)
        response('2fa enabled successfully', true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
  // #16
  disable2fa = async (req, res) => {
    try {
      const data = await verifyUser(req)
      const user = await fetch_single_user(req.params.email)
      const { code } = req.body
      if (!!data || !user.status || !code) {
        response(
          !!data
            ? data
            : !code
            ? '2fa code is required'
            : 'Invalid email address provided',
          false,
          !!data ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const codes = user.message['2faCodes']
        const isAvailable = !!codes.filter((data) => data === code).length
        if (isAvailable) {
          await update2fa(req.params.email, false, [])
          response('2fa disabled successfully', true, StatusCodes.OK, res)
        } else {
          response(
            '2fa code invalid or expired',
            false,
            StatusCodes.NOT_FOUND,
            res
          )
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #17
  validate2fa = async (req, res) => {
    try {
      const data = await verifyUser(req)
      const user = await fetch_single_user(req.params.email)
      const { code } = req.body

      if (!!data || !user.status || !code) {
        response(
          !!data
            ? data
            : !code
            ? '2fa code is required'
            : 'Invalid email address provided',
          false,
          !!data ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const codes = user.message['2faCodes']
        const isAvailable = !!codes.filter((data) => data === code).length
        if (!isAvailable) {
          response(
            '2fa code invalid or expired',
            false,
            StatusCodes.NOT_FOUND,
            res
          )
        } else {
          const newCodes = codes.filter((data) => data !== code)
          await update2faCodes(req.params.email, newCodes)
          response('validated', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #18
  getProfile = async (req, res) => {
    try {
      const data = await verifyUser(req)
      const user = await fetch_single_user(req.params.email)
      if (!!data || !user.status) {
        response(
          data || 'Invalid email address provided',
          false,
          !!data ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        response(user.message, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const user = new UserManagement(model)
Object.freeze(user)
module.exports = { user, UserManagement }
