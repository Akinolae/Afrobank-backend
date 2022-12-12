const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    allowNull: false,
    required: true,
  },
  cardToken: {
    type: String,
    allowNull: false,
    required: true,
  },
})

module.exports = mongoose.model('cards', cardSchema)
