require('dotenv').config()
const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SEND_GRID,
  },
})

const generateRandomEmail = () => {
  var char = 'abcdefghijklmnopqrstuvwxyz1234567890'
  var string = ''
  for (var i = 0; i < 12; i++) {
    string += char[Math.floor(Math.random() * char.length)]
  }
  return string + '@gmail.com'
}

const sendEmail = (recipient, config) => {
  transporter.sendMail(
    {
      from: process.env.EMAIL,
      to: recipient,
      ...config,
    },
    (error, info) => {
      if (error) {
        throw error
      } else {
        console.log(`Email Sent: ${info.response}`)
      }
    }
  )
}

module.exports = {
  sendEmail,
  transporter,
  generateRandomEmail,
}
