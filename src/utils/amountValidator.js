const { transfer } = require('./validator')

const validateAmount = (user, trxAmount) => {
    const { accountBalance } = user
    if (+accountBalance <= 0) {
        return transfer.low_balance
    } else if (+trxAmount <= 0) {
        return transfer.invalid_amount
    } else if (+trxAmount < 100) {
        return transfer.low_amount_error
    } else if (+trxAmount > +accountBalance) {
        return transfer.insufficient_balance
    }
}

module.exports = validateAmount
