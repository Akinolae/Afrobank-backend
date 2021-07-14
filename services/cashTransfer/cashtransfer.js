const customer = require('../../controller/transactions')

module.exports = {
    transfer: async (req, res) => {
        const { sender, recipient, amount, pin } = req.body
        customer.transfer(sender, recipient, amount, pin, res)
    },
}
