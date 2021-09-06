const { generate } = require('otp-generator')
const { decryptPassword } = require('./userUtil')

const createPin = (length = 4) => {
    return generate(length, {
        alphabets: false,
        digits: true,
        specialChars: false,
        upperCase: false,
    })
}

const isPinValid = async (data, pin) => {
    if (!data) return
    else {
        return await decryptPassword(data, pin)
    }
}
module.exports = { isPinValid, createPin }
