//imports
const { queries } = require('.')
const cards = require('../model/cards')
const customer = require('../model/customer')
const { ACTIONS } = require('../lib/mongoose')
const cardTrx = require('../model/cardTransactions')
const virtualAccount = require('../model/virtualAccounts')

const updatePassword = async (accountNumber, password) => {
  try {
    await queries.updateToDb([
      { accountNumber: accountNumber },
      { $set: { password: password, otp: null } },
    ])
    return { status: true, message: 'password changed' }
  } catch (error) {
    throw error
  }
}

const updateCard = async (config = {}, params = '') => {
  try {
    await queries.updateToDb([config, params], ACTIONS.FINDONEANDUPDATE, cards)
    return
  } catch (error) {
    throw error
  }
}

const updateNotification = async (
  customer = customer,
  accountNumber,
  message
) => {
  try {
    await queries.updateToDb([
      { accountNumber: accountNumber },
      {
        $push: {
          notifications: {
            notification_text: message,
          },
        },
      },
    ])

    return
  } catch (error) {
    throw error
  }
}

const createOtp = async (email, otp) => {
  try {
    await queries.updateToDb([
      {
        email: email,
      },
      { $set: { otp: otp } },
    ])

    return {
      status: true,
      message: 'If email exists you will recieve a 5 digit pin',
    }
  } catch (error) {
    throw error
  }
}

const deleteNotification = async (accountNumber, index) => {
  try {
    await queries.updateToDb([
      { accountNumber: accountNumber },
      { $pull: { notifications: { _id: index } } },
    ])

    return true
  } catch (error) {
    throw error
  }
}

const accountActivation = async (email, value) => {
  try {
    await queries.updateToDb([
      {
        email: email,
      },
      { $set: { active: value } },
    ])
  } catch (error) {
    throw error
  }
}

const newSchema = async (data) => {
  const { email, payload } = data
  try {
    await queries.updateToDb([{ email: email }, { $set: { token: payload } }])
  } catch (error) {
    throw error
  }
}

const addNewField = async (db, field, value) => {
  const update = async (params) => {
    const { db, field, value } = params
    await queries.updateToDb(
      [{}, { $set: { [field]: value } }],
      ACTIONS.UPDATEMANY,
      db
    )
  }

  try {
    switch (db) {
      case 'user':
        await update({ db: customer, field, value })
        break
      case 'cards':
        await update({ db: cards, field, value })
        break
      case 'cardTransactions':
        await update({ db: cardTrx, field, value })
        break
      case 'transactions':
        await update({ db: transactions, field, value })
      default:
        return null
    }
  } catch (error) {
    throw error
  }
}

const getAllUsers = async () => {
  try {
    const res = await queries.getFromDb([], ACTIONS.FIND)
    return {
      status: true,
      message: res,
    }
  } catch (e) {
    throw e
  }
}

const getAllAccounts = async () => {
  try {
    const res = await queries.getFromDb([], ACTIONS.FIND, virtualAccount)
    return {
      status: true,
      message: res,
    }
  } catch (error) {
    throw error
  }
}

const update2fa = async (email, activate, codes) => {
  try {
    await queries.updateToDb([
      {
        email: email,
      },
      {
        $set: {
          '2faEnabled': activate,
          '2faCodes': codes,
        },
      },
    ])
  } catch (error) {
    throw error
  }
}

const update2faCodes = async (email, codes) => {
  try {
    await queries.updateToDb([
      {
        email: email,
      },
      {
        $set: {
          '2faCodes': codes,
        },
      },
    ])
  } catch (error) {
    throw error
  }
}

module.exports = {
  createOtp,
  newSchema,
  update2fa,
  addNewField,
  updateCard,
  getAllUsers,
  getAllAccounts,
  updatePassword,
  update2faCodes,
  accountActivation,
  updateNotification,
  deleteNotification,
}
