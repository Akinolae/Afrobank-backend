const customer = require('../../controller/userManagement')

module.exports = {
    pinReset: (req, res) => {
        const { accountNumber, pin } = req.body
        customer.setPin(accountNumber, pin, res)
    },
}
