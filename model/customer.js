const mongoose = require("mongoose");

 const customer = new mongoose.Schema({
        firstname: {
            type: String,
        },
        lastname: {
            type: String,
        },
        pin: {
            type: String,
        },
        surname: {
            type: String,
        },
        email: {
            type: String,
        },
        phonenumber: {
            type: String,
        },
        gender: {
            type: String,
        },
        accountNumber: {
            type: Number,
            allowNull: false,
            primaryKey: true,
            unique: true
        },
        accountBalance: {
            type: Number,
            allowNull: false
        },
        createdAt: {
            type: Date,
            allowNull: false
        },
        otp: {
            type: Number,
            allowNull: true
        },
        transactionHist: [
            {
                type: String,
            }
        ]
    });
    
    module.exports = Customer = mongoose.model('customer', customer) 