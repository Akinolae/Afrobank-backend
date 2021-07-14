const Customer = require('../../controller/userManagement')

module.exports = {
    pinReset: (req, res) => {
        const { accountNumber, pin } = req.body
        const newCustomer = new Customer(customer)
        newCustomer.setPin(accountNumber, pin, res)
    },
}
