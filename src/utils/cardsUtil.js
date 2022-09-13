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

module.exports = {
  fetchAllCards,
}
