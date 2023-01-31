require('dotenv').config()
const fs = require('fs')
const { exec } = require('child_process')
const { default: axios } = require('axios')

let branch

exec('git rev-parse --abbrev-ref HEAD', (err, stdout, stderr) => {
  if (!!err) {
    throw err
  } else {
    branch = stdout
    console.log(`working branch:::${branch}`)
  }
})

const logInfo = async () => {
  let data
  console.log(`fetching banks from ${process.env.PROVIDER}`)
  try {
    const res = await axios.get('https://api.paystack.co/bank?currency=NGN')
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

const fetch = async () => {
  if (process.env.OS.toLowerCase().includes('windows')) {
    if (!fs.existsSync('./src/lib/banks.json')) {
      fs.appendFile(
        './src/lib/banks.json',
        JSON.stringify(await logInfo()),
        (err) => {
          if (err) throw err
          console.log('file created successfully')
        }
      )
    } else {
      fs.readFile('./src/lib/banks.json', 'utf8', (err, data) => {
        if (err) throw err
        // console.log(JSON.parse(data))
      })
    }
  }
}

fetch()
