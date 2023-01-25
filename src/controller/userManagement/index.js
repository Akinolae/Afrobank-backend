require('dotenv').config()
const model = require('../../model/customer')
const virtualAccount = require('../../model/virtualAccounts')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')

const {
  update2fa,
  setNewPin,
  createOtp,
  newSchema,
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
  notifications,
} = require('../../utils/validator')
const {
  validate2FA,
  hashPassword,
  decryptPassword,
  generate2FAcodes,
  fetch_single_user,
  verifyAccountNumber,
} = require('../../utils/userUtil')
const {ACTIONS, dbActionGenerator} = require("../../lib/mongoose")

class UserManagement {
  constructor(_customer_, _virtualAccount_) {
    this.customer = _customer_
    this.virtualAccount = _virtualAccount_
  }

  // #1
  register = async (params, res) => {
    const { firstName, lastName, email, phoneNumber, gender, password } = params
    const joi_validate = authSchema.validate(params)
    if (!!joi_validate.error) {
      response(
        joi_validate.error.details[0].message,
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
    } else {
      try {
        const hashedPassword = await hashPassword(password)

        const user = {
          firstName,
          lastName,
          email,
          phoneNumber,
          gender,
          password: hashedPassword,
        }

        let user_model = await dbActionGenerator(ACTIONS.CREATE, {
          collection: this.customer,
          data:[user]
        })
        await user_model.save()
        response(user_reg.resp_msg_registration, true, StatusCodes.OK, res)
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

  generateAccountNumber = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response(userData.message, false, StatusCodes.UNAUTHORIZED, res)
      } else {
        if (
          (await this.virtualAccount.find({ user_id: userData.message._id }))
            .length >= 1
        ) {
          response(
            'User has an existing account',
            true,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          const accountNumber = await createAccountNumber({
            type: 'accountNumber',
          })

          const accountData = {
            user_id: userData.message._id,
            active: true,
            pin: process.env.PIN,
            accountNumber: accountNumber,
            accountBalance: process.env.DEFAULT_BALANCE,
          }
          let accountModel = await new this.virtualAccount(accountData)
          await accountModel.save()
          response(
            'Account number generated successfully',
            true,
            StatusCodes.OK,
            res
          )
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
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
        const { message, status } = await fetch_single_user(userEmail.trim())
        const { email, password } = message
        const isValidUser =
          email !== userEmail.trim() ||
          !(await decryptPassword(userPassword.trim(), password))
        if (status) {
          if (isValidUser) {
            response(
              user_login.invalid_credentials,
              false,
              StatusCodes.UNAUTHORIZED,
              res
            )
          } else {
            const token = generateUserAccessToken({
              id: message.id,
              email: message.email,
            })
            await newSchema({
              model: this.customer,
              email: message.email,
              payload: token,
            })

            const data = {
              email: message.email,
              token,
              has2fa: message['2faEnabled'],
            }

            response(data, true, StatusCodes.OK, res)
          }
        } else {
          response(message, false, StatusCodes.UNAUTHORIZED, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #3
  getUser = async (req, res) => {
    try {
      const { userData } = await this.userVerification(req.params.email)
      if (!userData.status) {
        response(userData.message, false, StatusCodes.UNAUTHORIZED, res)
      } else {
        const { firstName, lastName } = userData.message
        response({ firstName, lastName }, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #4
  getUsers = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)

      const isUserAdmin = !!userData.message && userData.message.isAdmin

      if (!userData.status || !isUserAdmin) {
        response(
          !isUserAdmin
            ? 'You are not authorized to do that'
            : "User doesn't exist",
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        const resp = await getAllUsers()

        const allUsers = resp.message
          .filter((data) => data.account !== 'admin')
          .map((data) => ({
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            gender: data.gender,
            id: data._id,
            accountNumber: data.accountNumber,
            balance: data.accountBalance,
            transactions: data.transactions,
          }))
          .sort()

        response(allUsers, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #5
  setPin = async (pin, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      const invalidPin = !pin || pin.length !== 4
      if (!userData.status || invalidPin) {
        response(
          invalidPin ? 'Please provide a valid pin code' : userData.message,
          false,
          !userData.status
            ? StatusCodes.NOT_FOUND
            : StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        await setNewPin(this.customer, userData.message.accountNumber, pin)
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
    const reqEvent =
      req.url.split('/')[1] === 'activate'
        ? 'activate'
        : req.url.split('/')[1] === 'deactivate'
        ? 'deactivate'
        : ''

    try {
      const [admin, user] = await Promise.all([
        fetch_single_user(res.user.email),
        fetch_single_user(req.body.email),
      ])

      if (!admin.status || !user.status || !reqEvent) {
        response(
          !reqEvent
            ? 'Invalid url'
            : "Couldn't complete request, check credentials",
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        if (admin.message.isAdmin) {
          reqEvent === 'activate'
            ? await accountActivation(req.body.email, true)
            : await accountActivation(req.body.email, false)
          response(
            reqEvent === 'activate'
              ? 'account activated successfully'
              : 'account deactivated successfully',
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
      const { userData } = await this.userVerification(res.user.email)

      if (!userData.status) {
        response(!userData.status, false, StatusCodes.UNPROCESSABLE_ENTITY, res)
      } else {
        const { accountNumber } = userData.message
        const hash = await hashPassword(password)
        const data = await updatePassword(this.customer, accountNumber, hash)
        response(data.message, true, StatusCodes.OK, res)
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
  enable2fa = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)

      if (!userData.status) {
        response(userData.message, false, StatusCodes.NOT_FOUND, res)
      } else {
        if (userData.message['2faEnabled']) {
          response(
            '2fa is currently active',
            true,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          const { codes, hashedCodes } = await generate2FAcodes()
          await update2fa(res.user.email, true, hashedCodes)
          response(codes, true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
  // #14
  disable2fa = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      const { code } = req.body

      if (!userData.status || !userData.message['2faEnabled'] || !code) {
        response(
          !code
            ? '2fa code is required'
            : !userData.message['2faEnabled']
            ? "You don't have 2FA enabled"
            : 'Invalid email address',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const codes = userData.message['2faCodes']
        let responseValue = await validate2FA(codes, code)
        const isAvailable = responseValue.some(
          ({ isValid }) => isValid === true
        )

        if (isAvailable) {
          await update2fa(userData.message.email, false, [])
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

  // #15
  validate2fa = async (req, res) => {
    try {
      const { code } = req.body
      const { userData } = await this.userVerification(res.user.email)

      if (!userData.status || !code) {
        response(
          !code ? '2fa code is required' : 'Invalid email address provided',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const codes = userData.message['2faCodes']
        const responseValue = await validate2FA(codes, code)
        const isAvailable = responseValue.some(
          ({ isValid }) => isValid === true
        )

        if (!isAvailable) {
          response(
            '2fa code invalid or expired',
            false,
            StatusCodes.NOT_FOUND,
            res
          )
        } else {
          const newCodes = responseValue.map(({ isValid, data }) =>
            !isValid ? data : ''
          )
          await update2faCodes(userData.message.email, newCodes)
          response('validated', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #16
  userVerification = async (email) => {
    const userData = await fetch_single_user(email)

    return { userData }
  }

  // #17
  requestCodes = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      const codeNumber = userData.message['2faCodes'].filter((data) => !!data)
      const canRequestCode = codeNumber.length >= 1

      if (
        !userData.status ||
        !userData.message['2faEnabled'] ||
        canRequestCode
      ) {
        response(
          !userData.message['2faEnabled']
            ? 'You do not have 2FA enabled'
            : canRequestCode
            ? 'You cannot reset codes at this time'
            : 'Invalid email address provided',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const { codes, hashedCodes } = await generate2FAcodes()
        await update2fa(userData.message.email, true, hashedCodes)
        response(codes, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #18
  getProfile = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      !userData.status
        ? response(
            'Invalid email address provided',
            false,
            StatusCodes.NOT_FOUND,
            res
          )
        : response(userData, true, StatusCodes.OK, res)
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const user = new UserManagement(model, virtualAccount)
Object.freeze(user)
module.exports = { user, UserManagement }
