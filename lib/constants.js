const joi = require('joi')

const date = new Date()
const hours = date.getHours()
const minutes = date.getMinutes()

const authSchema = joi.object({
    firstName: joi.string().trim().required(),
    lastName: joi.string().trim().required(),
    surName: joi.string().trim().required(),
    email: joi
        .string()
        .trim()
        .email({ tlds: { allow: ['com'] } })
        .required(),
    phoneNumber: joi.string().trim().required(),
    gender: joi.any().valid('male', 'female'),
    password: joi.string().min(8).max(16).trim().required(),
})

const transferAuthSchema = joi.object({
    sender: joi.string().trim().required(),
    recipient: joi.string().trim().required(),
    amount: joi.number().required(),
    pin: joi.string().max(4).min(4).trim().required(),
})

const setPinSchema = joi.object({
    accountNumber: joi.string().trim().required(),
    pin: joi.string().max(4).min(4).trim().required(),
})

const completeTransactionSchema = joi.object({
    sender: joi.string().trim().required(),
    recipient: joi.string().trim().required(),
    otp: joi.string().max(5).min(5).trim().required(),
    amount: joi.number().required(),
})
const user_reg = {
    resp_msg_registration: 'Registration success',
    reg_mail_subject: 'Account registration',
    reg_mail_text: 'Registration',
    field_error: 'all fields are required',
    emailTemplate: (newUser, pin, accountBalance, accountNumber) => {
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
                <h4>Dear <strong>${newUser.toUpperCase()}</strong>,</h4>
            </div>
            </section>
            <section>
                <p> your <strong>Afrobank</strong> account was created successfully, Thank you for banking with us</p>
                <p>below is your account details </p>
                <p>please note that your account details should not be disclosed to anyone.</p>
                <p> welcome to the <strong>Afrobank</strong> family</p>
                <h3 style="font-weight: bold; font-size: 18px;">account number: <strong>${accountNumber}</strong></h3>
                <h3 style="font-weight: bold; font-size: 18px;">account name:  <strong> ${newUser.toUpperCase()}</strong></h3>
                <h3 style="font-weight: bold; font-size: 18px;">account balance:<strong> ${accountBalance}</strong></h3>
                <h3 style="font-weight: bold; font-size: 18px;">default pin:<strong> ${pin}</strong></h3>
                <h3 style="font-weight: bold; font-size: 18px;"> we urge you to change your transaction pin upon login and keep them confidential.</h3>
                 <h3 style="font-weight: bold; font-size: 18px;">Thank you for choosing <strong>Afrobank</strong>.</h3>
            </section>
        </body>
        </html>
        
        `
    },
}
const transfer = {
    pinError: 'Invalid pin',
    low_balance: 'low balance',
    insufficient_balance: 'Insufficient balance.',
    success_message: 'otp sent to your email address',
    single_user: 'Cash transfer must involve two parties',
}

const transactions = {}
const completeTransfer = {
    invalidAmount: 'Amount must be a number.',
    unsuccessful: 'Unable to complete transaction.',
    invalidCredentials: 'Check that credentials are valid',
    invalidOtp: 'Ivalid otp',
    message: (amount, surName, firstName, lastName) => {
        return `
            Your transfer of ${amount} to ${surName.toUpperCase()} ${firstName.toUpperCase()} ${lastName.toUpperCase()} was successful.
        `
    },
    senderTemplate: (
        firstName,
        surName,
        lastName,
        recipient,
        recipientFirstName,
        recipientSurname,
        recipientLastName,
        amount,
        senderNewBalance
    ) => {
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
            <section>
                <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank debit alert</strong></h2>
                <h4>Dear ${firstName} ${lastName} ${surName}</h4>
                <p>We wish to inform you that a debit transaction just occured on your account with us</p>
                <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
                <p>Description: CASH-TRANSFER</p>
                <p>Amount     :<strong> ${amount} </strong></p>
                <p>Time       :<strong> ${hours} : ${minutes}</strong></p>
                <p>Balance    : <strong>NGN ${senderNewBalance}</strong></p>
                <p>Recipient  : <strong>${recipient} ${recipientFirstName} ${recipientLastName} ${recipientSurname}</strong></p>
                Thank you for banking with <strong> Afrobank </strong>. 
            </section>
        </body>
        </html>
        
        `
    },
    recipientTemplate: (
        firstName,
        lastName,
        surName,
        amount,
        recipientBalance,
        senderFirstName,
        senderLastName,
        senderSurname
    ) => {
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
            <section>
            <h2 style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong>Afrobank Credit alert</strong></h2><br>
            <h4>Dear ${firstName} ${lastName} ${surName}</h4>
           <p>We wish to inform you that a credit transaction just occured on your account with us</p>
           <p style="text-decoration: underline;"><strong>Transaction notification</strong></p>
          <p>Description : CREDIT</p>
          <p>Amount      : <strong>${amount}</strong></p>
          <p>Time        : <strong>${hours} : ${minutes}</strong></p>
          <p>Balance     : <strong>NGN ${recipientBalance}</strong></p>  
          <p>Sender      : <strong>${senderFirstName} ${senderLastName} ${senderSurname}</strong></p><br>
          Thank you for banking with <strong> Afrobank </strong>. 
            </section>
        </body>
        </html>
        
        `
    },
}

const user_login = {
    credentials: 'Email and password is required',
    invalid_credentials: 'email or password invalid',
    login_success: 'Login successfully',
    email_text: 'Login notification',
    email_subject: 'Account Login',
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
    },
}
const pinReset = {
    message: 'Pin reset successful',
    error: 'Unable to reset pin, Check that your account number is valid.',
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
    },
}

module.exports = {
    user_login,
    user_reg,
    authSchema,
    transferAuthSchema,
    transfer,
    otp_messsage,
    setPinSchema,
    completeTransactionSchema,
    completeTransfer,
    pinReset,
}
