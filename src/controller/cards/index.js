const cards = require('../../model/cards')
const cardTrx = require('../../model/cardTransactions')
const { trxCore } = require('../../utils/transactionsUtil')
const { response } = require('../responseHandler')
const { updateCard, queries } = require('../../queries/queries')
const virtualAccount = require('../../model/virtualAccounts')
const { StatusCodes } = require('http-status-codes')
const { useCrypto, verifyCard } = require('../../utils/userUtil')
const { fetchAllCards, cardConditionsCheck } = require('../../utils/cardsUtil')
const {
  generateCard,
  generateTrxInfo,
  createAccountNumber,
} = require('../../utils')
const { dbActionGenerator, ACTIONS } = require('../../lib/mongoose')
const { v4: uuidv4 } = require('uuid')
const { user } = require('../userManagement')
const { default: axios } = require('axios')

//class @Cards contains all the actions pertaining to card
//1. @createCard ~~~ only authenticated users can create cards
//2. @gettingUserCards ~~~ only authenticated user can view his/her cards
//3. @sendMoney ~~~ only authenticared users can send money from cards

class Cards {
  constructor(_cards_, _virtualAccount_, _cardTrx_) {
    this.cards = _cards_
    this.virtualAccount = _virtualAccount_
    this.cardTrx = _cardTrx_
    this.user = user
  }

  createCard = async (req, res) => {
    try {
      const { userData } = await this.user.userVerification(res.user.email)

      if (!userData.status) {
        throw response('User not found', false, StatusCodes.NOT_FOUND, res)
      }

      await axios.post(
        'http://localhost:3006/Api/v1/create-card',
        {
          ...req.body,
          wallet_id: '0128949662',
          card_holder: 'mmavgcof@sharklasers.com',
        },
        {
          headers: {
            'x-api-key': 'h2#k^3@36yj@5zi',
          },
        }
      )

      const cards = (await fetchAllCards(userData.message.user_id)).length
      if (cards >= 3) {
        response(
          'You can only create three cards at a time',
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        // Generates a new card for users
        const [card, accountNumber] = await Promise.all([
          generateCard(userData),
          createAccountNumber({
            type: 'accountNumber',
          }),
        ])

        /* 
          
          For every new card created a new account number is generated
          Makes it easier to transact with the new cards as well as track 
          the transaction volume of the newly created cards.

          1. Generate Card && AccountNumber ("Method checks if either card exists before creating another to avoid duplicate cards")
          2. Newly generated Card is hashed before being saved to DB
          3. New account is saved to DB
          
          */

        const info = [
          {
            collection: this.virtualAccount,
            data: [
              {
                user_id: userData.message.user_id,
                active: true,
                account_id: uuidv4(),
                pin: process.env.PIN,
                accountNumber: accountNumber,
                accountBalance: process.env.DEFAULT_BALANCE,
                main: false,
              },
            ],
          },
          {
            collection: this.cards,
            data: [
              {
                cardToken: useCrypto({
                  payLoad: { ...card, accountNumber },
                }),
              },
            ],
          },
        ]

        const [newAccount, newCard] = await Promise.all([
          ...info.map(({ collection, data }) =>
            dbActionGenerator(ACTIONS.CREATE, {
              collection: collection,
              data: data,
            })
          ),
        ])

        await Promise.all([newCard.save(), newAccount.save()])

        response('Card creation successful', true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(
        !!error.response ? error.response.data.message : error.message,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        res
      )
    }
  }

  getUserCards = async (req, res) => {
    try {
      const { userData } = await this.user.userVerification(res.user.email)
      if (!userData.status) {
        throw response('User not found', false, StatusCodes.NOT_FOUND, res)
      }
      const cards = await fetchAllCards(userData.message.user_id)

      response(cards, true, StatusCodes.OK, res)
    } catch (error) {
      throw response(
        error.message,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        res
      )
    }
  }

  sendMoney = async (req, res) => {
    try {
      const { cardNumber, sendingCardId, cardPin, amount, description } =
        req.body

      const [isRecipientValid, isSenderValid, userCards] = await Promise.all([
        verifyCard(cardNumber),
        verifyCard(sendingCardId),
        fetchAllCards(res.user.id),
      ])

      const senderCard = this.getCurrentCard(userCards, isSenderValid)

      if (!isRecipientValid.status || !isSenderValid.status) {
        response(
          !isRecipientValid.status
            ? isRecipientValid.message
            : 'Sender card invalid',
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      }

      if (!Object.keys(senderCard).length) {
        response(
          "You're not authorized to spend from this card",
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      }

      const [sender, recipient, senderVirtualAccount, recipientVirtualAccount] =
        await Promise.all([
          cardConditionsCheck(isSenderValid.message),
          cardConditionsCheck(isRecipientValid.message),
          ...[
            isSenderValid.message.accountNumber,
            isRecipientValid.message.accountNumber,
          ].map((data) =>
            dbActionGenerator(ACTIONS.FIND, {
              collection: this.virtualAccount,
              data: [{ accountNumber: data }],
            })
          ),
        ])

      if (!sender.status || !recipient.status) {
        response(
          !recipient.status ? recipient.message : sender.message,
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      }
      let senderData, recipientData

      senderData = generateTrxInfo(
        senderVirtualAccount,
        'debit',
        description,
        amount
      )
      recipientData = generateTrxInfo(
        recipientVirtualAccount,
        'credit',
        description,
        amount
      )

      await trxCore({
        user: isSenderValid.message,
        trxPin: cardPin,
        amount,
        isCard: true,
        trxData: [senderData, recipientData],
      })

      response('Transfer success', true, StatusCodes.OK, res)
    } catch (error) {
      throw response(
        error.message,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        res
      )
    }
  }

  getCurrentCard = (userCards = [], user = {}) => {
    return userCards.find(
      (card) => card.cardNumber.toString() === user.message.cardNumber
    )
  }

  updateCardStatus = async (req, res) => {
    /*
    Function activates and deactivates cards
    */

    const { card, action } = req.query
    const validAction = !['deactivate', 'activate'].includes(action)
    try {
      if (!card || typeof card === undefined || validAction) {
        response(
          validAction ? 'Provide a valid action' : 'No card provided',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      }

      const [isCardValid, cards] = await Promise.all([
        verifyCard(card),
        fetchAllCards(res.user.user_id),
      ])

      let currentCard = this.getCurrentCard(cards, isCardValid)

      if (!isCardValid.status || !Object.keys(currentCard)) {
        throw response(
          !isCardValid.status
            ? 'Card invalid'
            : "You're not authorized to do that",
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      }
      /*
          based on the user action the card status is updated accordingly
          */

      action === 'deactivate'
        ? (currentCard.isActive = false)
        : (currentCard.isActive = true)
      await updateCard(
        { _id: isCardValid.message.id },
        {
          cardToken: useCrypto({
            payLoad: { ...currentCard },
          }),
        }
      )
      response(
        action === 'deactivate'
          ? 'Card deactivated successfully'
          : 'Card activated successfully',
        true,
        StatusCodes.OK,
        res
      )
    } catch (error) {
      response(
        error || error.message || 'An error occured',
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        res
      )
    }
  }

  changeCardPin = async (req, res) => {
    try {
      const { pin, cardNumber } = req.body
      const [isCardValid, cards] = await Promise.all([
        verifyCard(cardNumber),
        fetchAllCards(res.user.id),
      ])

      let currentCard = this.getCurrentCard(cards, isCardValid)

      if (!pin || !isCardValid.status || !Object.keys(currentCard)) {
        throw response(
          !pin
            ? 'Pin is required'
            : !isCardValid.status
            ? 'Card invalid'
            : "You're not authorized to do that",
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      }
      currentCard.pin = pin

      await updateCard(
        { _id: isCardValid.message.id },
        {
          cardToken: useCrypto({
            payLoad: { ...currentCard },
          }),
        }
      )
      response('Pin updated', true, StatusCodes.OK, res)
    } catch (error) {
      throw response(
        error.message,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        res
      )
    }
  }

  getCardTrx = async (req, res) => {
    const { no } = req.query
    const isCardValid = await verifyCard(no)
    try {
      if (!no || !isCardValid.status) {
        throw response(
          !no ? 'no card provided' : 'Card invalid',
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      }
      const cardTrx = (await queries.getFromDb([], '', this.cardTrx)).filter(
        (trx) => trx.cardNumber === isCardValid.message.cardNumber
      )

      response(cardTrx, true, StatusCodes.OK, res)
    } catch (error) {
      throw response(
        error.message,
        false,
        StatusCodes.INTERNAL_SERVER_ERROR,
        res
      )
    }
  }
}

const userCards = new Cards(cards, virtualAccount, cardTrx)
Object.freeze(userCards)

module.exports = userCards
