    const {
        customer
    } = require("../../model/customer");
    const Customer = require("../../controllers/index");
    const nodemailer = require("nodemailer")
    const {
        sequelize
    } = require("../../config/database/dbconnect");
    const otpGenerator = require('otp-generator');
    const otp = otpGenerator.generate(6, {alphabets: false, digits: true, specialChars: false, upperCase:false})

    require("dotenv").config();

    module.exports = {
        localLogin: (req, res) => {
            console.log(otp, 'otp')
            const {
                accountnumber,
                firstname
            } = req.body;
            const userLogin = new Customer(sequelize, customer, nodemailer)
            userLogin.login(accountnumber, firstname, res);
        }
    }