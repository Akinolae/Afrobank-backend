//This scripts section basically prepares the app to run
// The provider is needed to perform major transactions across the app
// Hence, the need to fetch all endpoints/resources of the selected provider as well ass the banks.

require('dotenv').config()
const fs = require('fs')
const { default: axios } = require('axios')
const { extractConfig } = require('../src/config/config')

// Gets all the required resources according to the provider specified
const getCurrentProviderConfig = () => {
  const providers = {
    payStack: 'payStack',
    flutterWave: 'flutterWave',
  }

  let data
  switch (extractConfig('provider')) {
    case providers.payStack:
      data = {
        fetchBanksUrl: 'https://api.paystack.co/bank?currency=NGN',
        transferRecipient: 'https://api.paystack.co/transferrecipient',
        transfer: 'https://api.paystack.co/transfer',
        resolveAccount: 'https://api.paystack.co/bank/resolve',
      }
      break
    case providers.flutterWave:
      data = {
        fetchBanksUrl: '',
      }
      break
    default:
      return null
  }

  data.provider = extractConfig('provider')
  return data
}

// shows the existing branch
// if (process.env.NODE_ENV === 'development') {
//   exec('git rev-parse --abbrev-ref HEAD', (err, stdout, stderr) => {
//     if (!!err) {
//       throw err
//     } else {
//       console.log(`working branch:::${stdout}`)
//     }
//   })
// }

// fetches banks according to the provider specified
const fetchBanks = async () => {
  let data

  console.log(`fetching banks from ${getCurrentProviderConfig().provider}`)
  try {
    const res = await axios.get(getCurrentProviderConfig().fetchBanksUrl)
    data = res.data.data.map((bank) => ({
      bank_name: bank.name,
      bank_code: bank.code,
      abbv: bank.slug,
    }))

    console.log('Banks fetched successfully')
  } catch (error) {
    throw error
  }

  return data
}

const writeToFile = (params = {}) => {
  const { path, data } = params

  return fs.appendFile(
    path,
    typeof data !== 'string' ? JSON.stringify(data) : data,
    (err) => {
      if (err) throw err
      console.log('file created successfully')
    }
  )
}

// Creates files that stores all the required credentials to make the app run smoothly
const createFile = async () => {
  const data = [
    {
      path: './src/lib/banks.json',
      data: await fetchBanks(),
    },
    {
      path: './src/lib/providerEndpoints.json',
      data: getCurrentProviderConfig(),
    },
  ]

  const fileExists = data
    .map((info) => ({
      path: info.path,
      data: info.data,
      exits: fs.existsSync(info.path),
    }))
    .filter((res) => !res.exits)

  if (!!fileExists.length) {
    await Promise.all([...fileExists.map((res) => writeToFile(res))])
  } else {
    fs.readFile('./src/lib/banks.json', 'utf8', (err, data) => {
      if (err) throw err
      // console.log(JSON.parse(data))
    })
  }
}

createFile()
