require('dotenv').config()
const banks = require('./banks.json')
const { v4: uuidv4 } = require('uuid')
const { default: axios } = require('axios')
const trxModel = require('../model/transactions')
const virtualAccount = require('../model/virtualAccounts')
const { verifyAccountNumber } = require('../utils/userUtil')
const { ACTIONS, dbActionGenerator } = require('./mongoose')
const providerEndpoints = require('./providerEndpoints.json')

const bankList = (bank_name = '') =>
  banks.find((bank) => bank.bank_name === bank_name)

const parseTrxDetails = (params = []) => {
  let recipient, sender

  if (!params.length || params.length !== 2) {
    throw 'Transfer details not provided'
  }

  if (Array.isArray(params)) {
    if (
      params.some(
        (val) => !!val.accountNumber && !!val.bank_name && !!val.amount
      )
    ) {
      sender = params[0]
      recipient = params[1]
    }
  }

  const parseData = (data) => ({
    account_number: data._accountNumber || data.accountNumber,
    amount: data.amount || data.trx_amount,
    bank_name: data.bank_name || data.bankName,
    ...data,
  })

  return {
    sender: parseData(sender),
    recipient: parseData(recipient),
  }
}

const resolveAccountNumber = async (params) => {
  console.log(params)
  const { account_number, bank_code, sender } = params

  try {
    const { data } = await axios.get(
      `${providerEndpoints.resolveAccount}?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${providerEndpoints.key}`,
        },
      }
    )

    return data
  } catch (error) {
    let accountNameError = RegExp('Could not resolve account name')

    if (!!accountNameError.test(error.response.data.message)) {
      await makeInternalTransfer({ account_number, bank_code, sender })
      return
    } else {
      throw error.response.data.message || error.message
    }
  }
}

const coreTransfer = async (params) => {
  const { recipient, sender } = parseTrxDetails(params)
  const { bank_code } = bankList(recipient.bank_name)

  try {
    const accountResolve = await resolveAccountNumber({
      account_number: recipient.account_number,
      bank_code,
      sender,
    })

    if (!!accountResolve?.data) {
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
            Authorization: `Bearer ${providerEndpoints.key}`,
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
          Authorization: `Bearer ${providerEndpoints.key}`,
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
      return
    }
  } catch (error) {
    throw error || error.response.data.message || error.message
  }
}

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
  account_id,
  trx,
}) => {
  const date = new Date()

  //generates transaction id for every transaction
  const transaction_id = uuidv4()

  console.log({
    transaction_id,
    transaction_type: _type_,
    amount: _amount_,
    description: _description_,
    transaction_date: date,
    user_id: user_id,
    account_id: account_id,
  })
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
              account_id: account_id,
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
  const { account_number, sender } = data

  try {
    const recipientDetails = await verifyAccountNumber(account_number)
    if (!recipientDetails.status) throw 'Recipient account number invalid'

    await Promise.all(
      ...[recipientDetails.user, sender].map((data) => {
        let type = !data.type ? 'credit' : data.type

        addTrxTodb({
          _type_: type,
          _accountNumber: data.accountNumber || data.account_number,
          _amount_: sender.amount,
          _description_: sender.description,
          user_id: data.user_id,
          account_id: data.account_id,
        })
      })
    )

    // await addTrxTodb({
    //   _type_,
    //   _accountNumber,
    //   _amount_,
    //   _description_: sender.description,
    //   user_id,
    //   accountDetails,
    // })
  } catch (error) {
    throw error
  }
}

module.exports = coreTransfer
