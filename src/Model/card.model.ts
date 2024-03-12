import * as mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  cardToken: {
    type: String,
    allowNull: false,
    required: true,
  },
});

export default mongoose.model('cards', cardSchema);
