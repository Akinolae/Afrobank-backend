const mongoose = require("mongoose");

 const customer = new mongoose.Schema({
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true

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
            unique: true
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
        createdAt: {
            type: Date,
            allowNull: false
        },
        otp: {
            type: Number,
            default: null
        },
        regDate: {
            type: Date,
            default: Date.now
        },
        transactionHist: [
            { transaction_id: {
                 type: String,
                 default: null
             },
            transaction_type: {
                    type: String,
                    default: null
             },
             amount: {
                 type: Number,
                 default: null
             }
        }
        ]
    });
    
    module.exports  = mongoose.model('customer', customer) 