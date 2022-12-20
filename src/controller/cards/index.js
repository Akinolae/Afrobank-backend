const cards = require('../../model/cards')
const cardTrx = require('../../model/cardTransactions')
const virtualAccount = require('../../model/virtualAccounts')
const { response } = require('../responseHandler')
const { StatusCodes } = require('http-status-codes')
const { updateTransaction, updateCard } = require('../../utils/queries')
const {
  useCrypto,
  verifyCard,
  fetch_single_user,
} = require('../../utils/userUtil')
const { fetchAllCards, cardConditionsCheck } = require('../../utils/cardsUtil')
const {
  generateCard,
  validateAmount,
  generateTrxInfo,
  createAccountNumber,
} = require('../../utils')

//class @Cards contains all the actions pertaining to card
//1. @createCard ~~~ only authenticated users can create cards
//2. @gettingUserCards ~~~ only authenticated user can view his/her cards
//3. @sendMoney ~~~ only authenticared users can send money from cards

class Cards {
  constructor(_cards_, _virtualAccount_) {
    this.cards = _cards_
    this.virtualAccount = _virtualAccount_
  }
  createCard = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response('User not found', false, StatusCodes.NOT_FOUND, res)
      } else {
        const cards = (await fetchAllCards(userData.message._id)).length
        if (cards >= 2) {
          response(
            'You can only create one card at a time',
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

          let newAccount = await new this.virtualAccount({
            user_id: userData.message._id,
            active: true,
            pin: process.env.PIN,
            accountNumber: accountNumber,
            accountBalance: process.env.DEFAULT_BALANCE,
          })
          const newCard = await new this.cards({
            cardToken: useCrypto({
              payLoad: { ...card, accountNumber },
            }),
            ownerId: userData.message._id,
          })
          await Promise.all([newCard.save(), newAccount.save()])

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
        const cards = (await fetchAllCards(userData.message._id)).map((card) =>
          JSON.parse(useCrypto({ payLoad: card.cardToken, encrypt: false }))
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

      /*
      Verify Both cards to know if they exist
      */

      const [isRecipientValid, isSenderValid, userCards] = await Promise.all([
        verifyCard(cardNumber),
        verifyCard(sendingCardId),
        fetchAllCards(res.user.id),
      ])

      /*
      picks sender card from list of cards and prepare for transaction
      We have to ensure that card belongs to the rightful owner before processing any transaction.
      */

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
      } else if (
        /*
      bloc only allows card owner to spend from card
      */
        !Object.keys(senderCard).length
      ) {
        response(
          "You're not authorized to spend from this card",
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        /* 
        gets virtual account attached to sender card
        */

        const senderVirtualAccount = await this.virtualAccount.find({
          accountNumber: isSenderValid.message.accountNumber,
        })

        /* 
        Check the conditions of both cards if they can accept or make transactions
        Check if user has sufficient balance to process transactions
        */

        const [sender, recipient, isValidAmount] = await Promise.all([
          cardConditionsCheck(isSenderValid.message),
          cardConditionsCheck(isRecipientValid.message),
          validateAmount(
            { accountBalance: senderVirtualAccount[0].accountBalance },
            amount
          ),
        ])

        if (
          !sender.status ||
          !recipient.status ||
          !!isValidAmount ||
          isSenderValid.message.pin !== cardPin
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

          /* 
          SenderData && RecipientData auto generates transaction information to be added to the DB          
          */

          senderData = generateTrxInfo(
            isSenderValid.message,
            'debit',
            description,
            amount
          )
          recipientData = generateTrxInfo(
            isRecipientValid.message,
            'credit',
            description,
            amount
          )

          await Promise.all([
            updateTransaction(
              this.virtualAccount,
              cardTrx,
              null,
              null,
              amount,
              null,
              null,
              {
                isCardTrx: true,
                trx: senderData,
              }
            ),
            updateTransaction(
              this.virtualAccount,
              cardTrx,
              null,
              null,
              amount,
              null,
              null,
              {
                isCardTrx: true,
                trx: recipientData,
              }
            ),
          ])

          response('Transfer success', true, StatusCodes.OK, res)
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getCurrentCard = (userCards = [], user = {}) => {
    return userCards
      .map((card) =>
        JSON.parse(useCrypto({ payLoad: card.cardToken, encrypt: false }))
      )
      .find((card) => card.cardNumber.toString() === user.message.cardNumber)
  }

  updateCardStatus = async (req, res) => {
    /*
    Function activates and deactivates cards
    */
    try {
      const { card, action } = req.query
      if (!card || typeof card === undefined || !action) {
        response(
          !action ? 'Provide an action' : 'No card provided',
          false,
          StatusCodes.NOT_FOUND,
          res
        )
      } else {
        const [isCardValid, cards] = await Promise.all([
          verifyCard(card),
          fetchAllCards(res.user.id),
        ])

        let currentCard = this.getCurrentCard(cards, isCardValid)

        if (!isCardValid.status || !Object.keys(currentCard)) {
          response(
            !isCardValid.status
              ? 'Card invalid'
              : "You're not authorized to do that",
            false,
            StatusCodes.UNPROCESSABLE_ENTITY,
            res
          )
        } else {
          /*
          based on the user action the card status is updated accordingly
          */

          action === 'deactivate'
            ? (currentCard.isActive = false)
            : (currentCard.isActive = true)
          await updateCard({
            _id: isCardValid.message.id,
            $set: {
              cardToken: useCrypto({
                payLoad: { ...currentCard },
              }),
            },
          })
          response(
            action === 'deactivate'
              ? 'Card deactivated successfully'
              : 'Card activated successfully',
            false,
            StatusCodes.OK,
            res
          )
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  changeCardPin = async (req, res) => {
    try {
      const { pin, cardNumber } = req.body
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response('User not found', false, StatusCodes.NOT_FOUND, res)
      } else {
        const cards = (await fetchAllCards(userData.message._id))
          .map((card) =>
            JSON.parse(useCrypto({ payLoad: card.cardToken, encrypt: false }))
          )
          .find((data) => data.cardNumber === cardNumber)

        console.log(cards)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const userCards = new Cards(cards, virtualAccount)
Object.freeze(userCards)

module.exports = userCards
