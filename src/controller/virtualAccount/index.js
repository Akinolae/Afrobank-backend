const { queries } = require('../../queries')
const { ACTIONS } = require('../../lib/mongoose')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { generateAccountNumber } = require('../../queries/user')
const { UserManagement } = require('../userManagement/index')
const virtualAccounts = require('../../model/virtualAccounts')
const model = require('../../model/customer')
const { getAllAccounts } = require('../../queries/queries')

class VirtualAccount extends UserManagement {
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

const virtualAccount = new VirtualAccount(model, virtualAccounts)
Object.freeze(virtualAccount)
module.exports = { virtualAccount, VirtualAccount }
