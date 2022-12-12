const { nanoid } = require('nanoid')
const cards = require('../../model/cards')
const cardTrx = require('../../model/cardTransactions')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction } = require('../../utils/queries')
const {
  fetch_single_user,
  verifyCard,
  useCrypto,
} = require('../../utils/userUtil')
const { fetchAllCards, cardConditionsCheck } = require('../../utils/cardsUtil')
const { generateCard, validateAmount, generateTrxInfo } = require('../../utils')

//class @Cards contains all the actions pertaining to card
//1. @createCard ~~~ only authenticated users can create cards
//2. @gettingUserCards ~~~ only authenticated user can view his/her cards
//3. @sendMoney ~~~ only authenticared users can send money from cards

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
        const cards = (await fetchAllCards(userData.message._id)).length
        if (cards === 3) {
          response(
            'You can only have three cards at the moment',
            false,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          const card = await generateCard(userData)

          const newCard = await new this.cards({
            cardToken: useCrypto({
              payLoad: card,
            }),
            ownerId: userData.message._id,
          })
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
        const cards = await fetchAllCards(userData.message._id)
        response(
          cards.map((card) =>
            JSON.parse(useCrypto({ payLoad: card.cardToken, encrypt: false }))
          ),
          true,
          StatusCodes.OK,
          res
        )
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

      // get the sending card with the card id
      const sendingCard = (await fetchAllCards(res.user.id))
        .map((card) =>
          JSON.parse(useCrypto({ payLoad: card.cardToken, encrypt: false }))
        )
        .find((card) => card.card_id.toString() === sendingCardId)

      //VerifyBoth cards to know if they exist
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
        //Check the conditions of both cards if they can process transactions
        //Check if user has suffcient balance to process transactions

        const [sender, recipient, isValidAmount] = await Promise.all([
          cardConditionsCheck(senderCard.message),
          cardConditionsCheck(recipientCard.message),
          validateAmount(
            { accountBalance: senderCard.message.balance },
            amount
          ),
        ])

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
          senderData = generateTrxInfo(
            senderCard.message,
            'debit',
            description,
            amount
          )
          recipientData = generateTrxInfo(
            recipientCard.message,
            'credit',
            description,
            amount
          )
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
