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
            unique: true
        },
        phonenumber: {
            type: String,
        },
        gender: {
            type: String,
        },
        accountNumber: {
            type: Number,
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
            { transaction_id: {
                 type: String,
             },
            transaction_type: {
                    type: String
             },
             amount: {
                 type: Number
             }
        }
        ]
    });
    
    module.exports = Customer = mongoose.model('customer', customer) 