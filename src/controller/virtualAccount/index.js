const { queries } = require('../../queries')
const { ACTIONS } = require('../../lib/mongoose')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { generateAccountNumber } = require('../../queries/user')
const model = require('../../model/virtualAccounts')
const { getAllAccounts } = require('../../queries/queries')
const { v4: uuidv4 } = require('uuid')

class VirtualAccount {
  constructor() {
    this.virtualAccount = model
  }
  generateVirtualAccount = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response('Unable to fetch user', false, StatusCodes.UNAUTHORIZED, res)
        return
      }

      const accountNumber = await generateAccountNumber(
        userData.message.user_id
      )

      const accountData = {
        user_id: userData.message.user_id,
        active: true,
        main: true,
        account_id: uuidv4(),
        pin: process.env.PIN,
        accountNumber: accountNumber,
        accountBalance: process.env.DEFAULT_BALANCE,
      }

      let accountModel = await queries.updateToDb(
        [accountData],
        ACTIONS.CREATE,
        this.virtualAccount
      )
      await accountModel.save()
      response(
        'Account number generated successfully',
        true,
        StatusCodes.OK,
        res
      )
    } catch (error) {
      response(
        error || error.message,
        false,
        StatusCodes.UNPROCESSABLE_ENTITY,
        res
      )
    }
  }

  getUserVirtualAccount = async (args) => {
    if (!Object.keys(args).length) {
      throw new Error('args cannot be empty')
    }

    const dataFromDb = await queries.getFromDb(
      [{ ...args }],
      ACTIONS.FINDONE,
      this.virtualAccount
    )
    if (!dataFromDb.account_id) {
      throw new Error(
        'You do not have a valid virtual account please create one'
      )
    }

    return dataFromDb
  }

  getFriendVirtualAccount = async (req, res) => {
    try {
      const { id } = req.query
      const { userData } = await this.userVerification(res.user.email)
      if (!id || !userData.status || !userData.message.friends.length) {
        response(
          !id ? 'Invalid user id' : userData.message,
          false,
          StatusCodes.BAD_REQUEST,
          res
        )
        return
      }

      if (!userData.message.friends.find((val) => val.user_id === id)) {
        response(
          "You're not friends with this user",
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
        return
      }

      const accounts = (await getAllAccounts()).message.find(
        (val) => val.user_id === id && !!val.main
      )

      if (!accounts) {
        response(
          'There is no account attached to this user',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
        return
      }
      response(accounts.accountNumber, true, StatusCodes.OK, res)
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const virtualAccount = new VirtualAccount()
Object.freeze(virtualAccount)
module.exports = { virtualAccount, VirtualAccount }
