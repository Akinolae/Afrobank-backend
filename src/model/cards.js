const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema({
  cardToken: {
    type: String,
    allowNull: false,
    required: true,
  },
})

module.exports = mongoose.model('cards', cardSchema)
