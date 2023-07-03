const { queries } = require('.')
const { createAccountNumber } = require('../utils')
const virtualAccount = require('../model/virtualAccounts')

const generateAccountNumber = async (id) => {
  //checks to know if user has an existing main account
  const hasActiveAccount = (
    await queries.getFromDb([{ user_id: id }], null, virtualAccount)
  ).find(({ main, active }) => main && active)

  if (!!hasActiveAccount) {
    throw 'Account already exists'
  }

  return (accountNumber = createAccountNumber({
    type: 'accountNumber',
  }))
}


module.exports = {
  generateAccountNumber,
}
