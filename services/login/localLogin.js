    const {
        customer
    } = require("../../model/customer");
    const Customer = require("../../controllers/index");
    const {
        sequelize
    } = require("../../config/database/dbconnect");

    require("dotenv").config();

    module.exports = {
        localLogin: (req, res) => {
            const {
                accountnumber,
                firstname
            } = req.body;
            const userLogin = new Customer(sequelize, customer)
            userLogin.login(accountnumber, firstname, res);
        }
    }