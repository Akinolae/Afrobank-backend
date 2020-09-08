    const {
        customer
    } = require("../../model/customer");
    const Customer = require("../../controllers/index");
    const nodemailer = require("nodemailer")
    const {
        sequelize
    } = require("../../config/database/dbconnect");


    require("dotenv").config();

    module.exports = {
        localLogin: async (req, res) => {
            const {
                accountnumber,
                firstname
            } = req.body;
            const userLogin = new Customer(sequelize, customer, nodemailer)
            userLogin.login(accountnumber, firstname, res);
        }
    }