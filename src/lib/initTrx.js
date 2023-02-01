require('dotenv').config()
const providerEndpoints = require('./providerEndpoints.json')
const banks = require('./banks.json')
const { default: axios } = require('axios')
const { v4: uuidv4 } = require('uuid')

const trxInit = async (params = {}) => {
  const { account_number, bank_name, amount } = params

  const getBankCode = banks.filter((bank) => bank.bank_name === bank_name)

  try {
    const { data } = await axios.get(
      `${providerEndpoints.resolveAccount}?account_number=${account_number}&bank_code=${getBankCode[0].bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST}`,
        },
      }
    )

    const trxDetails = {
      type: 'nuban',
      name: data.data.account_name,
      account_number: account_number,
      bank_code: getBankCode[0].bank_code,
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
