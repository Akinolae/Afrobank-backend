const { verifyAccountNumber } = require('../utils/userUtil')
const { updateBalance } = require('../utils/')
const { nanoid } = require('nanoid')
const { pinReset } = require('./constants')

const updateTransaction = async (
    _customer_,
    _type_,
    _accountNumber,
    _amount_
) => {
    const date = new Date()
    const transactionID = `${nanoid()}|${_type_}|${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}|${_amount_}`
    try {
        const response = await _customer_.findOneAndUpdate(
            { accountNumber: _accountNumber },
            {
                $push: {
                    transactions: {
                        transaction_id: transactionID.toUpperCase(),
                        transaction_type: _type_,
                        amount: _amount_,
                    },
                },
            }
        )
        await updateBalance(_customer_, _type_, _accountNumber, _amount_)
        return response
    } catch (error) {
        throw new Error(error)
    }
}

const setNewPin = async (_customer_, accountNumber, pin) => {
    try {
        const user = await verifyAccountNumber(accountNumber)

        if (user.status) {
            const resp = await _customer_.updateOne(
                { accountNumber: accountNumber },
                { $set: { pin: pin } }
            )
            return { status: true, message: pinReset.message }
        } else throw user
    } catch (err) {
        throw err || 'Something went wrong'
    }
}
module.exports = {
    updateTransaction,
    setNewPin,
}
