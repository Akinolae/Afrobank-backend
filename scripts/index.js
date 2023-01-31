const fs = require('fs')
const logInfo = require('./generateBankDetails')

const get = async () => {
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

get()
