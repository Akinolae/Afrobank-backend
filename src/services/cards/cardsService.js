const cards = require('../../controller/cards/index')

module.exports = {
  createCard: (req, res) => {
    cards.createCard(req, res)
  },
}
