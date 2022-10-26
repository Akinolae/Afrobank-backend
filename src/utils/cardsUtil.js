const cards = require('../model/cards')

const fetchAllCards = async (id) => {
  try {
    return ((await cards.find()) || []).filter(
      (card) => card.ownerId === String(id)
    )
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
