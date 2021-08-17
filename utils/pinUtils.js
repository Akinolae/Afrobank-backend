const { generate } = require('otp-generator')

const createPin = (length = 4) => {
    return generate(length, {
        alphabets: false,
        digits: true,
        specialChars: false,
        upperCase: false,
    })
}

const isPinValid = (data, pin) => {
    if (!data) return
    else {
        return data === pin
    }
}
module.exports = { isPinValid, createPin }
