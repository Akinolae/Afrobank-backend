const mongoose = require('mongoose')

const cardTransactionsSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    default: null,
  },
  user_id: {
    type: String,
    default: null,
  },
  cardNumber: {
    type: String,
    required: true,
    allowNull: false,
  },
  transaction_type: {
    type: String,
    default: null,
  },
  amount: {
    type: Number,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  transaction_date: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('cardTransactions', cardTransactionsSchema)
