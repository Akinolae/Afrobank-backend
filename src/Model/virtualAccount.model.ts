import * as mongoose from 'mongoose';

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
  main: {
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
    default: Date.now,
    allowNull: false,
  },
});

export default mongoose.model('account', Account);
