const mongoose = require('mongoose')

const Account = new mongoose.Schema({
  user_id: {
    type: String,
    default: null,
    required: true,
  },
  account_id: {
    type: String,
    default: null,
    required: true,
  },
  active: {
    type: Boolean,
    allowNull: false,
    required: true,
  },
  pin: {
    type: String,
    default: null,
  },
  accountNumber: {
    type: Number,
    unique: true,
    required: true,
  },

  accountBalance: {
    type: Number,
    allowNull: false,
    required: true,
  },
  createdAt: {
    type: Date,
    allowNull: false,
  },
})

module.exports = mongoose.model('account', Account)
