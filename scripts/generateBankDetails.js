require('dotenv').config()
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

module.exports = logInfo
