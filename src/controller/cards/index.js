const { createAccountNumber } = require('../../utils')
const { fetch_single_user } = require('../../utils/userUtil')
const cards = require('../../model/cards')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { createExpiryDate } = require('../../utils/dateUtils')
const { createPin } = require('../../utils/pinUtils')
const { fetchAllCards } = require('../../utils/cardsUtil')

class Cards {
  constructor(_cards_) {
    this.cards = _cards_
  }
  createCard = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response('User not found', false, StatusCodes.NOT_FOUND, res)
      } else {
        const cards = await fetchAllCards(userData.message._id)
        if (cards.length === 3) {
          response(
            'You can only have three cards at the moment',
            false,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          const cardNumber = await createAccountNumber({ type: 'Card' }, 16)
          const cardData = {
            cardNumber,
            created: new Date(),
            expiryDate: createExpiryDate(new Date(), 2),
            ownerId: userData.message._id,
            balance: 0,
            pin: createPin(),
            cvv: createPin(3),
          }
          const newCard = await new this.cards(cardData)
          await newCard.save()
          response('Card creation successful', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getUserCards = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response('User not found', false, StatusCodes.NOT_FOUND, res)
      } else {
        const cards = (await fetchAllCards(userData.message._id)).map(
          (card) => ({
            cvv: card.cvv,
            balance: card.balance,
            ownerId: card.ownerId,
            expiryDate: card.expiryDate,
            created: card.created,
            cardNumber: card.cardNumber,
            _id: card._id,
            isActive: card.isActive,
          })
        )

        response(cards, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  userVerification = async (email) => {
    const userData = await fetch_single_user(email)
    return { userData }
  }
}

const userCards = new Cards(cards)
Object.freeze(userCards)

module.exports = userCards
