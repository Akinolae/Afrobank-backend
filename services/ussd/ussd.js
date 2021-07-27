const customer = require('../../model/customer')
const ussdTransaction = require('../../controller/ussd')

module.exports = {
    ussdTransaction: (req, res) => {
        const { sessionId, serviceCode, phoneNumber, text } = req.body
        const newTransaction = new ussdTransaction()
        newTransaction.ussdTransaction(text, res)
    },
}
