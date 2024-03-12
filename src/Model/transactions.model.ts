import * as mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transaction_id: {
    type: String,
    default: null,
  },
  user_id: {
    type: String,
    default: null,
  },
  account_id: {
    type: String,
    default: null,
    required: true,
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
});

export default mongoose.model('transactions', transactionSchema);
