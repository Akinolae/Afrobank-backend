const cards = require('../model/cards')

const fetchAllCards = async (id) => {
  try {
    const allCards = (await cards.find()) || []
    return allCards.filter((card) => card.ownerId === String(id))
  } catch (error) {
    throw error
  }
}

module.exports = {
  fetchAllCards,
}
