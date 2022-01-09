const mongoose = require('mongoose')
const nodemailer = require('nodemailer')
const error = require('../utils/errorUtil')

const dbConfig = async (uri) => {
    if (typeof uri !== 'string') {
        error('Invalid database uri')
    } else {
        try {
            await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
                useCreateIndex: true,
            })
            console.log('=== DB connection established ===')
        } catch (error) {
            console.log(error)
        }
    }
}

const emailConfig = async (params) => {
    if (!params) {
        error('Params is required for config')
    } else if (typeof params !== 'object') {
        error('Params must be an object')
    } else {
        const { recipient, subject, text, message } = params
        async function main() {
            // create reusable transporter object using the default SMTP transport
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL, // Specific gmail account which can be found in the confi
                    pass: process.env.EMAIL_PASSWORD, // Specific gmail account which can be found in the co
                },
                tls: {
                    rejectUnauthorized: false,
                },
            })
            let info = await transporter.sendMail({
                from: `Afrobank ${process.env.EMAIL}`, // sender address
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

const appConfig = (config, params) => {
    // extract the specific config type
    const { type } = config
    if (!type || !params) error('configuration needs a type and a parameter')
    else if (typeof type !== 'string') error('app type must be a string')
    // Runs configuration based on the config type specified
    // makes it easier to add other configurations, dynamically
    else
        type === 'db'
            ? dbConfig(params)
            : type === 'email'
            ? emailConfig(params)
            : null
}

module.exports = { appConfig }
