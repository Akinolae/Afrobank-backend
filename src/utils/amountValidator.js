const { transfer } = require('./validator')

const validateAmount = (user, trxAmount) => {
  const { accountBalance } = user
  const amount = Number(trxAmount)

  if (+accountBalance <= 0) {
    return transfer.low_balance
  } else if (amount <= 0) {
    return transfer.invalid_amount
  } else if (amount < 100) {
    return transfer.low_amount_error
  } else if (amount > +accountBalance) {
    return transfer.insufficient_balance
  }
}

module.exports = validateAmount
