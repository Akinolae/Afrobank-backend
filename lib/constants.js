const joi = require("joi");

const authSchema = joi.object({
    firstName: joi.string().trim().required(),
    lastName: joi.string().trim().required(),
    surName: joi.string().trim().required(),
    email: joi.string().trim().email({ tlds: { allow: ['com']}}).required(),
    phoneNumber: joi.string().trim().required(),
    gender: joi.any().valid("male", "female")
})

const user_reg = {
    registration_error: 'User  already exists',
    resp_msg_registration: 'Registration success',
    reg_mail_subject: 'Account registration',
    reg_mail_text: 'Registration',
    field_error: 'all fields are required'
}

const user_login = {

}

module.exports = {
    user_login,
    user_reg,
    authSchema

}