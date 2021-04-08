const joi = require("joi");

const authSchema = joi.object({
    firstName: joi.string().trim().required(),
    lastName: joi.string().trim().required(),
    surName: joi.string().trim().required(),
    email: joi.string().trim().email({ tlds: { allow: ['com']}}).required(),
    phoneNumber: joi.string().trim().required(),
    gender: joi.any().valid("male", "female")
})

const transferAuthSchema = joi.object({
    sender: joi.string().trim().required(),
    recipient: joi.string().trim().required(),
    amount: joi.number().required(),
    pin: joi.string().max(4).min(4).trim().required()
})

const setPinSchema = joi.object({
    accountNumber: joi.string().trim().required(),
    pin: joi.string().max(4).min(4).trim().required()
})


const user_reg = {
    registration_error: 'User  already exists',
    resp_msg_registration: 'Registration success',
    reg_mail_subject: 'Account registration',
    reg_mail_text: 'Registration',
    field_error: 'all fields are required'
}
const transfer = {
    pinError: "Invalid pin",
    low_balance: 'low balance',
    insufficient_balance: 'Insufficient balance.',
    success_message: "otp sent to your email address",
    single_user: "Cash transfer must involve two parties"
}


const user_login = {
    credentials: "Account number and firstname is required",
    invalid_credentials: "Account number or username invalid",
    login_success: "Login successfully",
    email_text: 'Login notification',
    email_subject: 'Account Login'
}

const otp_messsage = {
    subject: 'AeNS Transaction OTP',
    text: 'OTP',
    template: (name, otp) => {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
            </head>
            <body>
                <section style="background-color: aquamarine;">
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <h5>AfroBank</h5>
                        <p>Your trusted life partner</p>
                    </div>
                </section>
                <section>
                <div>
                    <h4>Dear <b>${name}</b>,</h4>
                </div>
                </section>
                <section>
                        <h3 style="font-weight: bold; font-size: 18px;">Your otp is ${otp}</h3>
                </section>
            </body>
            </html>
            `

    }
}
const pinReset = {
    message: "Pin reset successful",
    error:    "Unable to reset pin, Check that your account number is valid.",
    emailTemplate: (name) => {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
            <section style="background-color: aquamarine;">
                <div style="display: flex; justify-content: center; align-items: center;">
                    <h5>AfroBank</h5>
                    <p>Your trusted life partner</p>
                </div>
            </section>
            <section>
            <div>
                <h4>Dear <b>${name}</b>,</h4>
            
            </div>
            </section>
            <section>
                    <h3 style="font-weight: bold; font-size: 18px;">pin reset successful</h3>
            </section>
        </body>
        </html>
        `
    }
}

module.exports = {
    user_login,
    user_reg,
    authSchema,
    transferAuthSchema, 
    transfer, 
    otp_messsage,
    setPinSchema,
    pinReset
}