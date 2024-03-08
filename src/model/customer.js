const mongoose = require('mongoose')

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

const friendSchema = new mongoose.Schema({
  user_id: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

const customer = new mongoose.Schema({
  user_id: {
    type: String,
  },
  email: {
    type: String,
  },
  notifications: [notificationSchema],
  friends: [friendSchema],
})

module.exports = mongoose.model('customer', customer)
