require('dotenv').config()
const providerEndpoints = require('./providerEndpoints.json')
const banks = require('./banks.json')
const { default: axios } = require('axios')
const { v4: uuidv4 } = require('uuid')
const { ACTIONS, dbActionGenerator } = require('./mongoose')
const virtualAccount = require('../model/virtualAccounts')
const trxModel = require('../model/transactions')
const { verifyAccountNumber } = require('../utils/userUtil')

const updateBalance = async (customer, type = '', accountNumber, amount) => {
  const { user, status, message } = await verifyAccountNumber(accountNumber)

  let currentBalance = 0
  if (status) {
    type.toLowerCase() === 'credit'
      ? (currentBalance += +user.accountBalance + +amount)
      : (currentBalance = +user.accountBalance - +amount)

    await dbActionGenerator(ACTIONS.FINDONEANDUPDATE, {
      collection: customer,
      data: [{ accountNumber }, { $set: { accountBalance: currentBalance } }],
    })
  } else {
    if (message === 'Unable to verify account number') {
      throw 'Unable to complete transaction'
    }
    throw message
  }
}

const addTrxTodb = async ({
  _customer_ = virtualAccount,
  transactions = trxModel,
  _type_,
  _accountNumber,
  _amount_,
  _description_,
  user_id,
  accountDetails,
  trx,
}) => {
  const date = new Date()

  //generates transaction id for every transaction
  const transaction_id = uuidv4()
  try {
    //Bloc processes all transactions
    let transactionModel = await dbActionGenerator(ACTIONS.CREATE, {
      collection: transactions,
      data: [
        !!trx
          ? {
              transaction_id,
              ...trx,
            }
          : {
              transaction_id,
              transaction_type: _type_,
              amount: _amount_,
              description: _description_,
              transaction_date: date,
              user_id: user_id,
              account_id: accountDetails.user.account_id,
            },
      ],
    })

    await Promise.all([
      transactionModel.save(),
      updateBalance(_customer_, _type_, _accountNumber, _amount_),
    ])
  } catch (error) {
    throw error.message || error
  }
}

const makeInternalTransfer = async (data) => {
  const {
    _type_,
    _accountNumber,
    _amount_,
    _description_,
    user_id,
    accountDetails,
  } = data.rest

  try {
    await addTrxTodb({
      _type_,
      _accountNumber,
      _amount_,
      _description_,
      user_id,
      accountDetails,
    })
  } catch (error) {
    throw error
  }
}

const bankList = (bank_name = '') =>
  banks.find((bank) => bank.bank_name === bank_name)

const parseTrxDetails = (params = {}) => {
  if (!Object.keys(params).length) {
    throw 'Transfer details not provided'
  }

  return {
    account_number: params._accountNumber || params.accountNumber,
    amount: params._amount_ || params.trx_amount,
    bank_name: params._bank_name || params.bankName,
    ...params,
  }
}

const trxInit = (params = {}) => {
  const { account_number, bank_name, amount, ...rest } = parseTrxDetails(params)

  if (!account_number || !bank_name || !amount)
    throw 'Please provide valid transaction information'

  const { bank_code } = bankList(bank_name)

  return {
    account_number,
    bank_name,
    amount: Number(amount),
    bank_code,
    ...rest,
  }
}

const resolveAccountNumber = async (params) => {
  const { account_number, bank_code, ...rest } = params

  try {
    const { data } = await axios.get(
      `${
        providerEndpoints.resolveAccount
      }?account_number=${'0128949662'}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST}`,
        },
      }
    )

    return data
  } catch (error) {
    let accountNameError = RegExp('Could not resolve account name')

    if (!!accountNameError.test(error.response.data.message)) {
      await makeInternalTransfer({ account_number, bank_code, ...rest })
      return
    } else {
      throw error.response.data.message || error.message
    }
  }
}

const coreTransfer = async (params) => {
  const { account_number, amount, bank_code, ...rest } = trxInit(params)

  try {
    const accountResolve = await resolveAccountNumber({
      account_number,
      bank_code,
      rest,
    })
    if (!!accountResolve.data) {
      const trxDetails = {
        type: 'nuban',
        name: accountResolve.data.account_name,
        account_number: accountResolve.data.account_number,
        bank_code: bank_code,
        currency: 'NGN',
      }

      const res = await axios.post(
        providerEndpoints.transferRecipient,
        trxDetails,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_TEST}`,
          },
        }
      )

      const ref = {
        source: 'balance',
        reason: rest._description_,
        amount: amount,
        reference: uuidv4(),
        recipient: res.data.data.recipient_code,
      }

      const { data } = await axios.post(providerEndpoints.transfer, ref, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST}`,
        },
      })

      await addTrxTodb({
        _amount_: data.data.amount,
        _description_: data.data.reason,
        user_id: rest.user_id,
        accountDetails: rest.accountDetails,
        _accountNumber: data.account_number,
        _type_: rest._type_,
      })
    }
  } catch (error) {
    throw error || error.response.data.message || error.message
  }
}

module.exports = coreTransfer
