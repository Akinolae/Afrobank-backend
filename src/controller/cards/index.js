const { createAccountNumber } = require('../../utils')
const { verifyUser, fetch_single_user } = require('../../utils/userUtil')
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
      const { email } = req.body

      const { userData, verify } = await this.userVerification(req, email)
      if (!!verify || !userData.status) {
        response(
          !!verify ? verify : 'User not found',
          false,
          !!verify ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
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
      const { userData, verify } = await this.userVerification(
        req,
        req.params.email
      )
      if (!!verify || !userData.status) {
        response(
          !!verify ? verify : 'User not found',
          false,
          !!verify ? StatusCodes.UNAUTHORIZED : StatusCodes.NOT_FOUND,
          res
        )
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

  userVerification = async (req = '', email) => {
    const [verify, userData] = await Promise.all([
      verifyUser({ email: email, req: req }),
      fetch_single_user(email),
    ])

    return { verify, userData }
  }
}

const userCards = new Cards(cards)
Object.freeze(userCards)

module.exports = userCards
