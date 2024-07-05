require('dotenv').config()
const model = require('../../model/customer')
const virtualAccount = require('../../model/virtualAccounts')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const {
  update2fa,
  getAllUsers,
  update2faCodes,
  updatePassword,
  accountActivation,
} = require('../../queries/queries.js')
const { queries } = require('../../queries')
const { generateUserAccessToken } = require('../../utils')
const { setNewPin } = require('../../utils/pinUtils')
const { pinReset, user_reg, user_login } = require('../../utils/validator')
const {
  validate2FA,
  hashPassword,
  generate2FAcodes,
  fetch_single_user,
  verifyUserAccessToken,
  getValueFromAttributes,
} = require('../../utils/userUtil')
const { ACTIONS } = require('../../lib/mongoose')
const {
  cognitoUserSignUp,
  confirmSignUp,
  cognitoSignIn,
  getUserFromCognito,
  cognitoForgotPassword,
  forgotPasswordVerification,
} = require('../../lib/cognito')
const { default: axios } = require('axios')

class UserManagement {
  constructor(_customer_, _virtualAccount_) {
    this.customer = _customer_
    this.virtualAccount = _virtualAccount_
  }

  /* Register user */
  register = async (params, res) => {
    const r = await axios.get('http://localhost:3006/Api/v1/get-cards')
    console.log({ dt: r.data })
    if (!!user_reg.validate(params)) {
      response(
        user_reg.validate(params),
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
      return
    }

    try {
      await cognitoUserSignUp({
        ...params,
      })

      const newUser = await queries.updateToDb(
        [{ email: params?.email }],
        ACTIONS.CREATE
      )
      newUser.save()
      response(user_reg.resp_msg_registration, true, StatusCodes.OK, res)
    } catch (err) {
      response(
        err.message,
        false,
        err?.statusCode ?? StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
    }
  }
  /* Register user ends */

  /* confirm user signup */
  confirmSignUp = async (email, code, res) => {
    try {
      await confirmSignUp({ email, code })
      response(user_reg.confirmation, true, StatusCodes.OK, res)
    } catch (error) {
      response(error?.message || error, false, StatusCodes.UNAUTHORIZED, res)
    }
  }
  /* confirm user signup ends*/

  /* user login */
  login = async (userEmail, userPassword, res) => {
    try {
      if (!userEmail || !userPassword) {
        response(
          'Invalid login parameters',
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
        return
      }

      // Call cognito endpoint to login
      const data = await cognitoSignIn({
        email: userEmail,
        password: userPassword,
      })

      // Fetch user from token returned by cognito
      const user = await getUserFromCognito(
        data.AuthenticationResult.AccessToken
      )

      const userDetails = {
        accessToken: data?.AuthenticationResult?.AccessToken,
        refreshToken: data?.AuthenticationResult?.RefreshToken,
        idToken: data?.AuthenticationResult?.IdToken,
        email: getValueFromAttributes(user.UserAttributes, 'email'),
        user_id: getValueFromAttributes(user.UserAttributes, 'custom:user_id'),
        verified: getValueFromAttributes(user.UserAttributes, 'email_verified'),
        phone_number: getValueFromAttributes(
          user.UserAttributes,
          'custom:phoneNumber'
        ),
        createdAt: getValueFromAttributes(
          user.UserAttributes,
          'custom:createdAt'
        ),
        first_Name: getValueFromAttributes(
          user.UserAttributes,
          'custom:firstName'
        ),
        last_Name: getValueFromAttributes(
          user.UserAttributes,
          'custom:lastName'
        ),
      }

      const userExits = await fetch_single_user(userDetails.email)

      if (!userExits.message.hasOwnProperty('user_id')) {
        await queries.updateToDb(
          [
            { email: userDetails.email },
            {
              user_id: userDetails.user_id,
            },
          ],
          ACTIONS.FINDONEANDUPDATE
        )
      }

      response(
        {
          ...userDetails,
          login: user_login.login_success,
        },
        true,
        StatusCodes.OK,
        res
      )
    } catch (error) {
      response(error.message || error, false, StatusCodes.UNAUTHORIZED, res)
    }
  }

  getUser = async (req, res) => {
    try {
      const { userData } = await this.userVerification(req.params.email)
      if (!userData.status) {
        response(userData.message, false, StatusCodes.UNAUTHORIZED, res)
        return
      }
      const { firstName, lastName } = userData.message
      response({ firstName, lastName }, true, StatusCodes.OK, res)
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getUsers = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      const isUserAdmin = !!userData.message?.isAdmin

      if (!userData.status || !isUserAdmin) {
        response(
          !isUserAdmin
            ? 'You are not authorized to do that'
            : "User doesn't exist",
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
        return
      }
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
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  setPin = async (req, res) => {
    const { pin, accountNumber } = req.body

    try {
      const { userData } = await this.userVerification(res.user.email)
      const accounts = (await queries.getFromDb([], null, this.virtualAccount))
        .filter((account) => account.user_id === res.user.user_id)
        .some((acc) => acc.accountNumber === +accountNumber)

      const invalidPin = !pin || pin.length !== 4

      if (!userData.status || invalidPin || !accounts) {
        response(
          invalidPin
            ? 'Please provide a valid pin code'
            : !accounts
            ? 'Please check account number and try again'
            : userData.message,
          false,
          !userData.status
            ? StatusCodes.NOT_FOUND
            : StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        await setNewPin(accountNumber, pin)
        response(pinReset.message, true, StatusCodes.OK, res)
      }
    } catch (e) {
      response(e.message, false, StatusCodes.BAD_REQUEST, res)
    }
  }

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

  forgotPassword = async (req, res) => {
    const { email } = req.body
    if (!email) {
      response(
        'email is required',
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
      return
    }

    try {
      await cognitoForgotPassword({ email })
      response(`Verification code sent to ${email}`, true, StatusCodes.OK, res)
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  forgotPasswordCodeVerification = async (req, res) => {
    const { email, code, password } = req.body
    if (!email || !code || !password) {
      response(
        'email and code is required',
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
      return
    }

    try {
      await forgotPasswordVerification(req.body)
      response(`Password reset successful`, true, StatusCodes.OK, res)
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

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
        let responseValue = (await validate2FA(codes, code)).some(
          ({ isValid }) => isValid === true
        )

        if (responseValue) {
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
          const newCodes = responseValue
            .map(({ isValid, data }) => (!isValid ? data : ''))
            .filter((code) => !!code)
          await update2faCodes(userData.message.email, newCodes)
          response('validated', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  userVerification = async (email) => {
    const userData = await fetch_single_user(email)
    return { userData }
  }

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

  getProfile = async (req, res) => {
    const { email } = req.query
    try {
      const { userData } = await this.userVerification(email)
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

  verifyToken = async (req, res) => {
    const { token } = req.body
    try {
      if (!token) {
        response(
          'no token provided',
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      }
      const resp = !!Object.keys(verifyUserAccessToken(token)).length

      response(resp, true, StatusCodes.OK, res)
    } catch (error) {
      const err = error.includes('invalid') || error.includes('malformed')

      response(
        err ? 'Invalid token' : error || error.message,
        false,
        StatusCodes.UNAUTHORIZED,
        res
      )
    }
  }

  getNewToken = async (req, res) => {
    const { email } = req.query
    const { userData } = await this.userVerification(email)
    try {
      if (!userData.status) {
        response(
          'Invalid email address provided',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const token = generateUserAccessToken({
          id: userData.message.id,
          email: userData.message.email,
          user_id: userData.message.user_id,
        })

        await queries.updateToDb(
          [
            { email: userData.message.email },
            {
              token: token,
            },
          ],
          ACTIONS.FINDONEANDUPDATE
        )

        response('token updated', true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  addFriend = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      const { user } = req.body
      if (
        !userData.status ||
        !user ||
        !!userData.message.friends.find((friend) => friend.user_id === user) ||
        userData.message.user_id === user
      ) {
        response(
          !userData.status ? userData.message : 'Please select a valid user',
          false,
          !userData.status
            ? StatusCodes.UNAUTHORIZED
            : StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        const isAvailable = await fetch_single_user(user, false)
        if (!isAvailable.status) {
          response(
            "User is invalid or doesn't exist",
            false,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          await queries.updateToDb(
            [
              { email: userData.message.email },
              {
                $push: {
                  friends: {
                    user_id: isAvailable.message.user_id,
                  },
                },
              },
            ],
            ACTIONS.FINDONEANDUPDATE
          )
          response('You have a new friend', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getFriendList = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response(userData.message, false, StatusCodes.UNAUTHORIZED, res)
      } else {
        const { friends } = userData.message
        if (!friends.length) {
          response('You do not have any friend', false, StatusCodes.OK, res)
        } else {
          const currentFriends = (await this.friendsCore(friends)).map(
            (friend) => ({
              firstName: friend.firstName,
              lastName: friend.lastName,
              user_id: friend.user_id,
            })
          )
          response(currentFriends, true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  friendsCore = async (friends = []) => {
    const users = await getAllUsers()
    return friends.map((friend) => {
      let currentFriend
      if (!!friend.user_id) {
        currentFriend = users.message.find(
          (user) => user.user_id === friend.user_id
        )
      }
      return currentFriend
    })
  }
}

const user = new UserManagement(model, virtualAccount)
Object.freeze(user)
module.exports = { user, UserManagement }
