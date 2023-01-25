const cards = require('../../controller/cards/index')

module.exports = {
  createCard: (req, res) => {
    cards.createCard(req, res)
  },
  fetchCards: (req, res) => {
    cards.getUserCards(req, res)
  },
  sendMoney: (req, res) => {
    cards.sendMoney(req, res)
  },
  resetPin: (req, res) => {
    cards.changeCardPin(req, res)
  },
  updateCardStatus: (req, res) => {
    cards.updateCardStatus(req, res)
  },
  fetchCardTransactions: (req, res) => {
    cards.getCardTrx(req, res)
  }
}
