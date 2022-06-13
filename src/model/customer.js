const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    default: null,
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

const notificationSchema = new mongoose.Schema({
  notification_text: {
    type: String,
    required: true,
  },
  notification_date: {
    type: Date,
    default: Date.now,
  },
})

const customer = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    allowNull: false,
  },
  pin: {
    type: String,
    default: null,
  },
  token: {
    type: String,
    default: null,
  },
  otp: {
    type: String,
    default: null,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: Number,
    unique: true,
    required: true,
  },
  '2faEnabled': {
    type: Boolean,
    default: false,
  },
  '2faCodes': {
    type: Array,
    allowNull: true,
  },
  accountBalance: {
    type: Number,
    allowNull: false,
  },
  account: {
    type: String,
    allowNull: false,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    allowNull: false,
  },
  regDate: {
    type: Date,
    default: Date.now,
  },
  transactions: [transactionSchema],
  notifications: [notificationSchema],
})

module.exports = mongoose.model('customer', customer)
