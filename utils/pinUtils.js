const { generate } = require('otp-generator')

const createPin = (length = 4) => {
    const pin = generate(length, {
        alphabets: false,
        digits: true,
        specialChars: false,
        upperCase: false,
    })
    return pin
}

const isPinValid = (data, pin) => {
    if (!data) {
        return
    } else {
        const resp = data === pin
        return resp
    }
}
module.exports = { isPinValid, createPin }
