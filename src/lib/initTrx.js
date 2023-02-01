const providerEndpoints = require('./providerEndpoints.json')
const banks = require('./banks.json')
const { default: axios } = require('axios')

const trxInit = async (params = {}) => {
  const { account_number, bank_name } = params

  const getBankCode = banks.filter((bank) => bank.bank_name === bank_name)

  try {
    const { data } = await axios.get(
      `${providerEndpoints.resolveAccount}?account_number=${account_number}&bank_code=${getBankCode[0].bank_code}`,
      {
        headers: {
          Authorization: `Bearer sk_test_6c31890acb4f486353df6ae065ec3e3046adad42`,
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
          Authorization: `Bearer sk_test_6c31890acb4f486353df6ae065ec3e3046adad42`,
        },
      }
    )

    const ref = {
      source: 'balance',
      reason: 'Savings',
      amount: 30000,
      reference: 'your-unique-reference',
      recipient: res.data.data.recipient_code,
    }

    console.log(
      await axios.post(providerEndpoints.transfer, ref, {
        headers: {
          Authorization: `Bearer sk_test_6c31890acb4f486353df6ae065ec3e3046adad42`,
        },
      })
    )
  } catch (error) {
    throw error
  }
}

module.exports = trxInit
