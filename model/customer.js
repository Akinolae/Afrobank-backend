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
    transaction_date: {
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
    pin: {
        type: String,
        required: true,
    },
    surName: {
        type: String,
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
    accountBalance: {
        type: Number,
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
})

module.exports = mongoose.model('customer', customer)
