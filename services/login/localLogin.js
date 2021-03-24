require("dotenv").config();
const customer = require("../../model/customer");
const Customer = require("../../controller/index");

    module.exports = {
        localLogin: (req, res) => {
            const {
                accountNumber,
                firstName
            } = req.body;
            const userLogin = new Customer(sequelize, customer)
            userLogin.login(accountNumber, firstName, res);
        }
    }