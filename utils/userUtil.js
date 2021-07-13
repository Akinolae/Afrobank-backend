const customer = require('../model/customer')

const fetch_single_user = async (accountNumber) => {
    try {
        const isAvailable = await customer
            .findOne({ accountNumber })
            .then((data) => data)
            .catch((error) => error)
        if (isAvailable === null || isAvailable === 'undefined') {
            return { status: false, message: 'Invalid account number' }
        } else {
            return { status: true, message: isAvailable }
        }
    } catch (err) {
        console.log(err)
    }
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

module.exports = { fetch_single_user, login_notify }
