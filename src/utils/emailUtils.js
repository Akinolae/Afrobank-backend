require('dotenv').config()
const nodemailer = require('nodemailer')

const sendMail = async (message, recipient, subject, text) => {
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

const generateRandomEmail = () => {
    var char = 'abcdefghijklmnopqrstuvwxyz1234567890'
    var string = ''
    for (var i = 0; i < 12; i++) {
        string += char[Math.floor(Math.random() * char.length)]
    }
    return string + '@gmail.com'
}
module.exports = { sendMail, generateRandomEmail }
