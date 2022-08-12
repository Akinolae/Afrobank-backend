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
  verifyUser,
  validate2FA,
  hashPassword,
  decryptPassword,
  generate2FAcodes,
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
        const [accountNumber, hashedPassword] = await Promise.all([
          createAccountNumber(this.customer),
          hashPassword(password),
        ])

        const user = {
          firstName,
          lastName,
          email,
          phoneNumber,
          gender,
          accountNumber,
          accountBalance: process.env.DEFAULT_BALANCE,
          password: hashedPassword,
        }

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
              id: data.message.id,
              email: data.message.email,
            })
            await newSchema({
              model: this.customer,
              email: data.message.email,
              payload: token,
            })

            response(
              {
                email: data.message.email,
                token,
                has2fa: data.message['2faEnabled'],
              },
              true,
              200,
              res
            )
          }
        } else {
          response(data.message, false, StatusCodes.UNAUTHORIZED, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #3
  getUser = async (req, res) => {
    try {
      const { verify, userData } = await this.userVerification(req)
      if (!!verify || !userData.status) {
        response(
          userData || "User doesn't exist" || 'Unable to fetch user',
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
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
      const { verify, userData } = await this.userVerification(req)
      const resp = await getAllUsers()

      const isUserAdmin = !!userData.message && userData.message.isAdmin

      if (!!verify || !userData.status || !isUserAdmin) {
        response(
          verify
            ? verify
            : !isUserAdmin
            ? 'You are not authorized to do that'
            : "User doesn't exist",
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
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
    const reqEvent =
      req.url.split('/')[1] === 'activate'
        ? 'activate'
        : req.url.split('/')[1] === 'deactivate'
        ? 'deactivate'
        : ''

    try {
      const [verify, admin, user] = await Promise.all([
        verifyUser(req),
        fetch_single_user(req.params.email),
        fetch_single_user(req.body.email),
      ])

      if (!!verify || !admin.status || !user.status || !reqEvent) {
        response(
          verify
            ? verify
            : !reqEvent
            ? 'Invalid url'
            : "Couldn't complete request, check credentials",
          false,
          !admin.status || !user.status
            ? StatusCodes.UNPROCESSABLE_ENTITY
            : StatusCodes.UNAUTHORIZED,
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
      await addNewField('isAdmin', false)
    } catch (error) {
      console.log(error)
    }
  }

  // #15
  enable2fa = async (req, res) => {
    try {
      const resp = await Promise.allSettled([
        verifyUser(req),
        fetch_single_user(req.params.email),
      ])
      if (!!resp[0].value || !resp[1].status) {
        response(
          resp[0].value || 'Invalid email address provided',
          false,
          !!resp[0].value ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        if (resp[1].value.message['2faEnabled']) {
          response(
            '2fa is currently active',
            true,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          const { codes, hashedCodes } = await generate2FAcodes()
          await update2fa(req.params.email, true, hashedCodes)
          response(codes, true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
  // #16
  disable2fa = async (req, res) => {
    try {
      const { userData, verify } = await this.userVerification(req)
      const { code } = req.body

      if (
        verify ||
        !userData.status ||
        !userData.message['2faEnabled'] ||
        !code
      ) {
        response(
          !!verify
            ? verify
            : !code
            ? '2fa code is required'
            : !userData.message['2faEnabled']
            ? "You don't have 2FA enabled"
            : 'Invalid email address',
          false,
          !!verify ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const codes = userData.message['2faCodes']
        let responseValue = await validate2FA(codes, code)
        const isAvailable = responseValue.some(
          ({ isValid }) => isValid === true
        )

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
      const { code } = req.body
      const { userData, verify } = await this.userVerification(req)

      if (!!verify || !userData.status || !code) {
        response(
          !!verify
            ? verify
            : !code
            ? '2fa code is required'
            : 'Invalid email address provided',
          false,
          !!verify ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
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
          await update2faCodes(req.params.email, newCodes)
          response('validated', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  userVerification = async (req = '') => {
    const [verify, userData] = await Promise.all([
      verifyUser(req),
      fetch_single_user(req.params.email),
    ])

    return { verify, userData }
  }

  requestCodes = async (req, res) => {
    try {
      const { verify, userData } = await this.userVerification(req)
      const codeNumber = userData.message['2faCodes'].filter((data) => !!data)
      const canRequestCode = codeNumber.length >= 1

      if (
        !!verify ||
        !userData.status ||
        !userData.message['2faEnabled'] ||
        canRequestCode
      ) {
        response(
          verify
            ? verify
            : !userData.message['2faEnabled']
            ? 'You do not have 2FA enabled'
            : canRequestCode
            ? 'You cannot reset codes at this time'
            : 'Invalid email address provided',
          false,
          !!verify ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const { codes, hashedCodes } = await generate2FAcodes()
        await update2fa(req.params.email, true, hashedCodes)
        response(codes, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  // #18
  getProfile = async (req, res) => {
    try {
      const { verify, userData } = await this.userVerification(req)
      if (!!verify || !userData.status) {
        response(
          verify || 'Invalid email address provided',
          false,
          !!verify ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
      } else {
        response(userData, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const user = new UserManagement(model)
Object.freeze(user)
module.exports = { user, UserManagement }
