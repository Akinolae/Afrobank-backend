//imports
const cards = require('../model/cards')
const cardTrx = require('../model/cardTransactions')
const customer = require('../model/customer')
const transactions = require('../model/transactions')
const { nanoid } = require('nanoid')
const { pinReset } = require('./validator')
const { updateBalance } = require('../utils/')
const { verifyAccountNumber, hashPassword } = require('../utils/userUtil')

// updates transactions db for both card and normal transactions ...//
const updateTransaction = async (
  _customer_,
  transactions,
  _type_,
  _accountNumber,
  _amount_,
  _description_,
  user_id,
  { isCardTrx, trx } = {}
) => {
  const date = new Date()

  //generates transaction id for every transaction

  const transactionID = `${nanoid()}|${
    _type_ || trx.transaction_type
  }|${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}|${_amount_}`
  try {
    //Bloc processes only non card transactions
    if (isCardTrx === undefined || !isCardTrx) {
      let transactionModel = await new transactions({
        transaction_id: transactionID.toUpperCase(),
        transaction_type: _type_,
        amount: _amount_,
        description: _description_,
        transaction_date: date,
        user_id: user_id,
      })

      transactionModel.save()
      await updateBalance(_customer_, _type_, _accountNumber, _amount_)
    } else {
      //Bloc processes card transactions
      //updates the transactions table accordingly as well as balance of the cards...//
      let cardTransaction = await new transactions({
        transaction_id: transactionID.toUpperCase(),
        ...trx,
      })
      cardTransaction.save()
      await updateBalance(
        _customer_,
        trx.transaction_type,
        trx.cardNumber,
        _amount_,
        { isCardTrx }
      )
    }
    return true
  } catch (error) {
    throw new Error(error)
  }
}
//transactions update ends...

const updatePassword = async (cutomer, accountNumber, password) => {
  try {
    await customer.updateOne(
      { accountNumber: accountNumber },
      { $set: { password: password, otp: null } }
    )
    return { status: true, message: 'password changed' }
  } catch (error) {
    throw error
  }
}

const setNewPin = async (_customer_, accountNumber, pin) => {
  try {
    const user = await verifyAccountNumber(accountNumber)
    if (user.status) {
      const hashedPin = await hashPassword(pin, 10)
      await _customer_.updateOne(
        { accountNumber: accountNumber },
        { $set: { pin: hashedPin } }
      )
      return { status: true, message: pinReset.message }
    } else throw user
  } catch (err) {
    throw err || 'Something went wrong'
  }
}

const updateNotification = async (customer, accountNumber, message) => {
  try {
    await customer.updateOne(
      { accountNumber: accountNumber },
      {
        $push: {
          notifications: {
            notification_text: message,
          },
        },
      }
    )
    return
  } catch (error) {
    throw error
  }
}

const createOtp = async (customer, email, otp) => {
  try {
    await customer.updateOne(
      {
        email: email,
      },
      { $set: { otp: otp } }
    )

    return {
      status: true,
      message: 'If email exists you will recieve a 5 digit pin',
    }
  } catch (error) {
    throw error
  }
}

const deleteNotification = async (customer, accountNumber, index) => {
  try {
    await customer.updateOne(
      { accountNumber: accountNumber },
      { $pull: { notifications: { _id: index } } }
    )
    return true
  } catch (error) {
    throw error
  }
}

const accountActivation = async (email, value) => {
  try {
    await customer.updateOne(
      {
        email: email,
      },
      { $set: { active: value } }
    )
  } catch (error) {
    throw error
  }
}

const newSchema = async (data) => {
  const { model, email, payload } = data
  try {
    await model.updateOne({ email: email }, { $set: { token: payload } })
  } catch (error) {
    throw error
  }
}

const addNewField = async (db, field, value) => {
  const update = async (params) => {
    const { db, field, value } = params
    await db.updateMany({}, { $set: { [field]: value } })
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
    const res = await customer.find()
    return {
      status: true,
      message: res,
    }
  } catch (e) {
    throw e
  }
}

const update2fa = async (email, activate, codes) => {
  try {
    await customer.updateOne(
      {
        email: email,
      },
      {
        $set: {
          '2faEnabled': activate,
          '2faCodes': codes,
        },
      }
    )
  } catch (error) {
    throw error
  }
}

const update2faCodes = async (email, codes) => {
  try {
    await customer.updateOne(
      {
        email: email,
      },
      {
        $set: {
          '2faCodes': codes,
        },
      }
    )
  } catch (error) {
    throw error
  }
}

module.exports = {
  createOtp,
  setNewPin,
  newSchema,
  update2fa,
  addNewField,
  getAllUsers,
  updatePassword,
  update2faCodes,
  accountActivation,
  updateTransaction,
  updateNotification,
  deleteNotification,
}
