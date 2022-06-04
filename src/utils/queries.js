const { verifyAccountNumber, hashPassword } = require('../utils/userUtil')
const { updateBalance } = require('../utils/')
const { nanoid } = require('nanoid')
const { pinReset } = require('./validator')
const customer = require('../model/customer')

const updateTransaction = async (
  _customer_,
  _type_,
  _accountNumber,
  _amount_,
  _description_
) => {
  const date = new Date()
  const transactionID = `${nanoid()}|${_type_}|${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}|${_amount_}`
  try {
    const response = await _customer_.findOneAndUpdate(
      { accountNumber: _accountNumber },
      {
        $push: {
          transactions: {
            transaction_id: transactionID.toUpperCase(),
            transaction_type: _type_,
            amount: _amount_,
            description: _description_,
          },
        },
      }
    )
    await updateBalance(_customer_, _type_, _accountNumber, _amount_)
    return response
  } catch (error) {
    throw new Error(error)
  }
}

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

const addNewField = async (field, value) => {
  try {
    console.log(field, value)
    await customer.updateMany(
      {},
      {
        $set: { [field]: value },
      }
    )
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

module.exports = {
  addNewField,
  accountActivation,
  updateTransaction,
  setNewPin,
  updateNotification,
  deleteNotification,
  createOtp,
  updatePassword,
  newSchema,
  getAllUsers,
}
