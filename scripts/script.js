//  This scripts section basically prepares the app to run
//  The provider is needed to perform major transactions across the app
//  Hence, the need to fetch all endpoints/resources of the selected provider as well ass the banks.

require('dotenv').config()
const fs = require('fs')
const { default: axios } = require('axios')
const { extractConfig } = require('../src/config/config')

// Gets all the required resources according to the provider specified
const getCurrentProviderConfig = () => {
  const providers = {
    payStack: 'paystack',
    flutterWave: 'flutterwave',
  }

  let data
  switch (extractConfig('provider').toLowerCase()) {
    case providers.payStack:
      data = {
        fetchBanksUrl: 'https://api.paystack.co/bank?currency=NGN',
        transferRecipient: 'https://api.paystack.co/transferrecipient',
        transfer: 'https://api.paystack.co/transfer',
        resolveAccount: 'https://api.paystack.co/bank/resolve',
        key: extractConfig('token'),
      }
      break
    case providers.flutterWave:
      data = {
        fetchBanksUrl: 'https://api.flutterwave.com/v3/banks/NG',
        transfer: 'https://api.flutterwave.com/v3/transfers',
        key: extractConfig('token'),
      }

      break
    default:
      return null
  }

  data.provider = extractConfig('provider')
  return data
}

// fetches banks according to the provider specified
const fetchBanks = async () => {
  let data

  try {
    const res = await axios.get(getCurrentProviderConfig().fetchBanksUrl, {
      headers: {
        Authorization: `Bearer ${getCurrentProviderConfig().key}`,
      },
    })
    data = res.data.data.map((bank) => ({
      bank_name: bank.name,
      bank_code: bank.code,
      abbv: bank.slug,
    }))

    console.log('Banks fetched successfully')
    return data
  } catch (error) {
    throw error
  }
}

const writeToFile = (params = {}) => {
  const { path, data } = params

  return fs.appendFile(
    path,
    typeof data !== 'string' ? JSON.stringify(data) : data,
    (err) => {
      if (err) throw err
      console.log(`${path} created successfully`)
    }
  )
}

const fileExists = (file) => {
  return fs.existsSync(file)
}

const deleteFile = (path) => {
  return fs.unlink(path, (err, data) => {
    if (!!err) throw err
    console.log(`${path}: deleted`)
  })
}
// Creates files that stores all the required
// credentials to make the app run smoothly

;(async () => {
  const bank = './src/lib/banks.json'
  const providerEndpoints = './src/lib/providerEndpoints.json'

  if (fileExists(bank)) {
    deleteFile(bank)
  }

  if (fileExists(providerEndpoints)) {
    deleteFile(providerEndpoints)
  }

  writeToFile({ path: bank, data: await fetchBanks() })
  writeToFile({ path: providerEndpoints, data: getCurrentProviderConfig() })
})()
