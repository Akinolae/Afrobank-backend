const { transfer } = require('./validator')

const validateAmount = (user, trxAmount) => {
  const { accountBalance } = user
  const amount = Number(trxAmount)

  return +accountBalance <= 0
    ? transfer.low_balance
    : amount <= 0
    ? transfer.invalid_amount
    : amount < 100
    ? transfer.low_amount_error
    : amount > +accountBalance
    ? transfer.insufficient_balance
    : ''
}

module.exports = validateAmount
