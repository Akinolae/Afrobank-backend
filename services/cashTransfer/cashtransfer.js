const customer = require('../../controller/transactions')

module.exports = {
    transfer: async (req, res) => {
        const { sender, recipient, amount, pin } = req.body
        customer.transfer(sender, recipient, amount, pin, res)
    },

    completeTransfer: (req, res) => {
        const { otp, sender, recipient, amount } = req.body
        customer.completeTransfer(res, sender, recipient, amount, otp)
    },
}
