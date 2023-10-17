const joi = require('joi')
const { template } = require('../templates/welcomeEmail')
const { newSchema } = require('../queries/queries')

const authSchema = joi.object({
  firstName: joi.string().trim().required(),
  lastName: joi.string().trim().required(),
  email: joi
    .string()
    .trim()
    .email({ tlds: { allow: ['com'] } })
    .required(),
  phoneNumber: joi.string().trim().required(),
  password: joi.string().min(8).max(16).trim().required(),
})

const transferAuthSchema = joi.object({
  sender: joi.string().trim().required(),
  recipient: joi.string().trim().required(),
  amount: joi.number().required(),
  pin: joi.string().max(4).min(4).trim().required(),
  bank_name: joi.string().trim().required(),
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
  resp_msg_registration:
    'User registered successfully, confirmation email sent.',
  welcome_text:
    'your Afrobank account was created successfully, enjoy smooth payments and deposits on our platform for free',
  reg_mail_subject: 'Account registration',
  reg_mail_text: 'Registration',
  field_error: 'all fields are required',
  confirmation: 'Account verified successfully',
  emailTemplate: template.registerationSuccess,
  validate: (params) => {
    const validate = authSchema.validate(params)
    if (!!validate.error) return validate.error.details[0].message
  },
}
const transfer = {
  pinError: 'Invalid pin',
  low_balance: 'low balance',
  insufficient_balance: 'Insufficient balance.',
  invalid_amount: 'please enter a valid amount',
  low_amount_error: 'you can only send ₦ 100 or more',
  success_message: (amount) => {
    return `Transfer of ₦${amount} was successful`
  },
  single_user: 'Cash transfer must involve two parties',
}

const notifications = {
  delete: 'notification deleted',
  deleteError: 'unable to delete notification',
}

const token = {
  invalidToken: 'Invalid token',
  unauthorized: 'Unauthorized user',
  noToken: 'No auth token provided',
}

const completeTransfer = {
  invalidAmount: 'Amount must be a number.',
  unsuccessful: 'Unable to complete transaction.',
  invalidCredentials: 'Check that credentials are valid',
  invalidOtp: 'Ivalid otp',
  message: (amount, surName, firstName, lastName) => {
    return `Your transfer of ₦${amount} to ${surName.toUpperCase()} ${firstName.toUpperCase()} ${lastName.toUpperCase()} was successful.`
  },
  senderTemplate: template.transferSent,
}

const user_login = {
  login_success: 'Login successfully',
  email_text: 'Login notification',
  email_subject: 'Account Login',
  validate: async (email, password) => {
    // Validates user login credentials
    // const { message, status } = await fetch_single_user(email)
    new Promise((resolve, reject) => {
      try {
        cognito.signUp(
          { email: email, password: password },
          function (err, data) {
            if (err) {
              return reject(err)
            }
            return resolve(data)
          }
        )
      } catch (e) {
        return reject(e)
      }
    })

    // if (
    //   !email ||
    //   !password ||
    //   !status ||
    //   email !== message.email ||
    //   !(await decryptPassword(password, message.password))
    // ) {
    //   throw 'email or password invalid'
    // }

    await newSchema({
      email: message.email,
      payload: '',
    })

    return message
  },
}

const otp_messsage = {
  subject: 'AeNS Transaction OTP',
  text: 'OTP',
  template: template.otp,
}
const pinReset = {
  message: 'Pin reset successful',
  error: 'Unable to reset pin, Check that your account number is valid.',
  emailTemplate: template.pin,
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
  notifications,
  token,
}
