require('dotenv').config()
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const error = require('../utils/errorUtil')
const { extractConfig } = require('../config/config')
const Mailgun = require('mailgun.js')
const formData = require('form-data')

const dbConfig = async () => {
  const url = extractConfig('URI')
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    console.log('==== Connection established ====')
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}

const emailConfig = async (mailgun = true, params) => {
  if (!params) {
    error('Params is required for config')
  } else if (typeof params !== 'object') {
    error('Params must be an object')
  } else {
    if (mailgun) {
      const useMailGun = new Mailgun(formData)
      const client = useMailGun.client({
        username: 'api',
        key: process.env.MAIL_GUN,
      })
      client.messages
        .create(process.env.MAIL_GUN_CLIENT, params)
        .then((res) => console.log(res))
        .catch((err) => console.log(err))
      return
    }
    const { recipient, subject, text, message } = params
    async function main() {
      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: true, // true for 465, false for other ports
        auth: {
          user: extractConfig('email'), // Specific gmail account which can be found in the confi
          pass: extractConfig('password'), // Specific gmail account which can be found in the co
        },
        tls: {
          rejectUnauthorized: false,
        },
      })
      let info = await transporter.sendMail({
        from: 'afrobank', // sender address
        to: recipient, //reciever address that was gotten from the frontend/client
        subject: subject,
        text: text,
        html: message,
      })
      console.log('Message sent: %s', info.messageId)
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
    }
    main()
  }
}

const appConfig = (config, params = {}) => {
  // extract the specific config type
  const { type } = config
  if (!type || !params) error('app config needs a config type and a parameter')
  else if (typeof type !== 'string') error('app type must be a string')
  // Runs configuration based on the config type specified
  // makes it easier to add other configurations, dynamically
  else {
    switch (type) {
      case 'db':
        dbConfig(params)
        break
      case 'email':
        emailConfig(true, params)
        break
      default:
        return null
    }
  }
}

module.exports = { appConfig }
