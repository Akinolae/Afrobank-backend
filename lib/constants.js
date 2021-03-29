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

const user_reg = {
    registration_error: 'User  already exists',
    resp_msg_registration: 'Registration success',
    reg_mail_subject: 'Account registration',
    reg_mail_text: 'Registration',
    field_error: 'all fields are required'
}
const transfer = {
    pinError: "Invalid pin",
    low_balance: 'your account balance is low',
    insufficient_balance: 'Insufficient balance.',
    success_message: "otp sent to your email address"
}


const user_login = {

}

module.exports = {
    user_login,
    user_reg,
    authSchema,
    transferAuthSchema, 
    transfer
}