const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    allowNull: false,
  },
  created: {
    type: Date,
    default: Date.now,
    required: true,
    allowNull: false,
  },
  expiryDate: {
    type: Date,
    required: true,
    allowNull: false,
  },
  ownerId: {
    type: String,
    required: true,
    allowNull: false,
  },
  balance: {
    type: Number,
    allowNull: false,
  },
  cvv: {
    type: Number,
    allowNull: false,
  },
  pin: {
    type: String,
    default: null,
  },
})

module.exports = mongoose.model('cards', cardSchema)
