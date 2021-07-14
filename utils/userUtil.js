const customer = require('../model/customer')
const jwt = require('jsonwebtoken')
const encrypt = require('bcryptjs')

const fetch_single_user = async (email) => {
    try {
        const isAvailable = await customer
            .findOne({ email })
            .then((data) => data)
            .catch((error) => error)
        if (isAvailable === null || isAvailable === 'undefined') {
            return {
                status: false,
                message: 'invalid email address or password',
            }
        } else {
            return { status: true, message: isAvailable }
        }
    } catch (err) {
        throw err
    }
}

const verifyAccountNumber = async (accountNumber) => {
    try {
        const isValid = await customer.findOne({ accountNumber })
        return isValid
    } catch (error) {}
}

const login_notify = (data) => {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const customerCareLine = '08183430438'

    const msg = `  <h2  style="color: white; background-color: #2C6975; padding: 30px; width: 50%;"><strong> Afrobank </strong></h2><br>
    <p>Dear <strong> ${data.firstName} ${data.lastName} ${data.surName} </strong></p>
    <p>A login attempt was made in your account at <strong>${hours}:${minutes}</strong>.</p>
    <p>If this is you kindly ignore, else, contact us at <strong>${customerCareLine}</strong>.</p><br>

    <p>Thank you for choosing AfroBank.</p> 
`
    return msg
}

const generateUserAccessToken = (payload) => {
    return jwt.sign(payload, process.env.TOKEN_SECRET)
}

const verifyUserAccessToken = (token) => {
    return jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
        if (err) {
            throw err
        } else {
            return data
        }
    })
}

const hashPassword = async (password) => {
    const hash = await encrypt.hash(password, 15)
    return hash
}

const decryptPassword = async (password1, password2) => {
    const decrypt = await encrypt.compare(password1, password2)
    return decrypt
}

module.exports = {
    fetch_single_user,
    login_notify,
    generateUserAccessToken,
    verifyUserAccessToken,
    hashPassword,
    decryptPassword,
    verifyAccountNumber,
}
