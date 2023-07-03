const cards = require('../model/cards')
const { useCrypto } = require('./userUtil')
const { queries } = require('../queries/queries')
const { ACTIONS } = require('../lib/mongoose')

const fetchAllCards = async (id) => {
  try {
    return (await queries.getFromDb([], ACTIONS.FIND, cards))
      .map((card) =>
        JSON.parse(useCrypto({ payLoad: card.cardToken, encrypt: false }))
      )
      .filter((card) => card.ownerId === id)
  } catch (error) {
    throw error
  }
}

const cardConditionsCheck = (card) => {
  let isCardValid
  if (!card.isActive || new Date() >= new Date(card.expiryDate)) {
    isCardValid = {
      status: false,
      message: !card.isActive
        ? 'Transactions are not permitted on this card'
        : 'Transactions are not permitted on expired cards',
    }
  } else {
    isCardValid = { status: true, message: '' }
  }
  return isCardValid
}

module.exports = {
  fetchAllCards,
  cardConditionsCheck,
}
