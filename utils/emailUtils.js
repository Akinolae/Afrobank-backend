const nodemailer = require('nodemailer')

const sendMail = async (message, recipient, subject, text) => {
    async function main() {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
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

module.exports = sendMail
