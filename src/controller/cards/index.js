const cards = require('../../model/cards')
const cardTrx = require('../../model/cardTransactions')
const transactions = require('../../model/transactions')
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
const { dbActionGenerator, ACTIONS } = require('../../lib/mongoose')
const { v4: uuidv4 } = require('uuid')
const { trxCore } = require('../../utils/transactionsUtil')

//class @Cards contains all the actions pertaining to card
//1. @createCard ~~~ only authenticated users can create cards
//2. @gettingUserCards ~~~ only authenticated user can view his/her cards
//3. @sendMoney ~~~ only authenticared users can send money from cards

class Cards {
  constructor(_cards_, _virtualAccount_, _cardTrx_, _transactions_) {
    this.cards = _cards_
    this.virtualAccount = _virtualAccount_
    this.cardTrx = _cardTrx_
    this.transactions = _transactions_
  }
  createCard = async (req, res) => {
    try {
      const { userData } = await this.userVerification(res.user.email)
      if (!userData.status) {
        response('User not found', false, StatusCodes.NOT_FOUND, res)
      } else {
        const cards = (await fetchAllCards(userData.message.user_id)).length
        if (cards >= 3) {
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
        const cards = await fetchAllCards(userData.message.user_id)

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
      } else if (!Object.keys(senderCard).length) {
        response(
          "You're not authorized to spend from this card",
          false,
          StatusCodes.UNAUTHORIZED,
          res
        )
      } else {
        const [
          sender,
          recipient,
          senderVirtualAccount,
          recipientVirtualAccount,
        ] = await Promise.all([
          cardConditionsCheck(isSenderValid.message),
          cardConditionsCheck(isRecipientValid.message),
          ...[
            { account: isSenderValid.message.accountNumber },
            { account: isRecipientValid.message.accountNumber },
          ].map((data) =>
            dbActionGenerator(ACTIONS.FIND, {
              collection: this.virtualAccount,
              data: [{ accountNumber: data.account }],
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
        } else {
          let senderData, recipientData

          try {
            await trxCore({
              user: isSenderValid.message,
              trxPin: cardPin,
              amount,
            })

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

            await Promise.all([
              ...[senderData, recipientData].map((data) =>
                updateTransaction({
                  trx: data,
                })
              ),
            ])

            response('Transfer success', true, StatusCodes.OK, res)
          } catch (error) {
            response(error, false, StatusCodes.UNPROCESSABLE_ENTITY, res)
          }
          /* 
          SenderData && RecipientData auto generates transaction information to be added to the DB          
          */
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
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
      } else {
        const [isCardValid, cards] = await Promise.all([
          verifyCard(card),
          fetchAllCards(res.user.user_id),
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
        }
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
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
        response(
          !pin
            ? 'Pin is required'
            : !isCardValid.status
            ? 'Card invalid'
            : "You're not authorized to do that",
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
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
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }

  getCardTrx = async (req, res) => {
    const { no } = req.query
    const isCardValid = await verifyCard(no)
    try {
      if (!no || !isCardValid.status) {
        response(
          !no ? 'no card provided' : 'Card invalid',
          false,
          StatusCodes.UNPROCESSABLE_ENTITY,
          res
        )
      } else {
        const cardTrx = (
          await dbActionGenerator(ACTIONS.FIND, {
            collection: this.cardTrx,
            data: [],
          })
        ).filter((trx) => trx.cardNumber === isCardValid.message.cardNumber)

        response(cardTrx, true, StatusCodes.OK, res)
      }
    } catch (error) {
      response(error.message, false, StatusCodes.INTERNAL_SERVER_ERROR, res)
    }
  }
}

const userCards = new Cards(cards, virtualAccount, cardTrx, transactions)
Object.freeze(userCards)

module.exports = userCards
