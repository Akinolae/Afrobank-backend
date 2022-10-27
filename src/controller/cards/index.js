const { createAccountNumber, validateAmount } = require('../../utils')
const {
  fetch_single_user,
  verifyCard,
  fetch_single_user_id,
} = require('../../utils/userUtil')
const cards = require('../../model/cards')
const cardTrx = require('../../model/cardTransactions')
const { updateTransaction } = require('../../utils/queries')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { createExpiryDate } = require('../../utils/dateUtils')
const { createPin } = require('../../utils/pinUtils')
const { fetchAllCards, cardConditionsCheck } = require('../../utils/cardsUtil')

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

  sendMoney = async (req, res) => {
    try {
      const { cardNumber, sendingCardId, cardPin, amount, description } =
        req.body
      const sendingCard = (await fetchAllCards(res.user.id)).find(
        (card) => card._id.toString() === sendingCardId
      )

      const [recipientCard, senderCard] = await Promise.all([
        verifyCard(cardNumber),
        verifyCard(!!sendingCard ? sendingCard.cardNumber : ''),
      ])

      if (!recipientCard.status || !senderCard.status) {
        response(
          !recipientCard.status ? recipientCard.message : senderCard.message,
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        const [sender, recipient] = await Promise.all([
          cardConditionsCheck(senderCard.message),
          cardConditionsCheck(recipientCard.message),
        ])

        const isValidAmount = validateAmount(
          { accountBalance: senderCard.message.balance },
          amount
        )
        if (
          !sender.status ||
          !recipient.status ||
          !!isValidAmount ||
          sendingCard.pin !== cardPin
        ) {
          response(
            !recipient.status
              ? recipient.message
              : !sender.status
              ? sender.message
              : !!isValidAmount
              ? isValidAmount
              : 'Invalid pin',
            false,
            !!isValidAmount
              ? StatusCodes.UNPROCESSABLE_ENTITY
              : StatusCodes.UNAUTHORIZED,
            res
          )
        } else {
          let senderData, recipientData

          senderData = {
            cardNumber: senderCard.message.cardNumber,
            transaction_type: 'debit',
            amount: amount,
            user_id: senderCard.message.ownerId,
            description: !!description
              ? `AFROBANK-CARD||TRX-${description}`
              : 'AFROBANK-CARD||TRX',
            transaction_date: new Date(),
          }

          recipientData = {
            cardNumber: recipientCard.message.cardNumber,
            transaction_type: 'credit',
            amount: amount,
            user_id: recipientCard.message.ownerId,
            description: !!description
              ? `AFROBANK-CARD||TRX-${description}`
              : 'AFROBANK-CARD||TRX',
            transaction_date: new Date(),
          }

          await Promise.all([
            updateTransaction(cards, cardTrx, null, null, amount, null, null, {
              isCardTrx: true,
              trx: senderData,
            }),
            updateTransaction(cards, cardTrx, null, null, amount, null, null, {
              isCardTrx: true,
              trx: recipientData,
            }),
          ])

          response('Transfer success', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const userCards = new Cards(cards)
Object.freeze(userCards)

module.exports = userCards
