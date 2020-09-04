const {
    customer
} = require("../../model/customer");
const {
    sequelize
} = require("../../config/database/dbconnect");
const Customer = require("../index");
const newUser = new Customer(sequelize, customer);


module.exports = {
    getUsers: (req, res) => {
        newUser.getUsers(res)
    },
    getUser: (req, res) => {
        const { accountNumber } = req.body;
         newUser.getUser(accountNumber, res)
    },
}