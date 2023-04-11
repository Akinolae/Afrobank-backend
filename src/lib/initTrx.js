require('dotenv').config()
const providerEndpoints = require('./providerEndpoints.json')
const banks = require('./banks.json')
const { default: axios } = require('axios')
const { v4: uuidv4 } = require('uuid')

const backList = (bank_name = '') =>
  banks.find((bank) => bank.bank_name === bank_name)

const parseTrxDetails = (params = {}) => {
  if (!Object.keys(params).length) {
    throw 'Transaction details is required to parse'
  }

  return {
    account_number: params._accountNumber || params.accountNumber,
    amount: params._amount_ || params.trx_amount,
    bank_name: params._bank_name || params.bankName || 'Guaranty Trust Bank',
  }
}

const resolveAccountNumber = async (account_number, bank_code) => {
  try {
    const { data } = await axios.get(
      `${providerEndpoints.resolveAccount}?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST}`,
        },
      }
    )

    return data
  } catch (error) {
    throw error.response.data.message || error.message
  }
}

const trxInit = async (params = {}) => {
  const { account_number, bank_name, amount } = parseTrxDetails(params)

  console.log({ bank_name, account_number, amount })

  if (!account_number || !bank_name || !amount)
    throw 'please provide valid transaction information'

  const { bank_code } = backList(bank_name)
  const data = await resolveAccountNumber(account_number, bank_code)
  try {
    console.log(data)
    const trxDetails = {
      type: 'nuban',
      name: data.data.account_name,
      account_number: account_number,
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
      reason: 'Savings',
      amount: amount,
      reference: uuidv4(),
      recipient: res.data.data.recipient_code,
    }

    await axios.post(providerEndpoints.transfer, ref, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_TEST}`,
      },
    })
  } catch (error) {
    throw error
  }
}

module.exports = trxInit
