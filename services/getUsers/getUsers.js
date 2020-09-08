const {
    customer
} = require("../../model/customer");
const {
    sequelize
} = require("../../config/database/dbconnect");
const Customer = require("../../controllers/index");
const newUser = new Customer(sequelize, customer);


module.exports = {
     getUser: (req, res) => {
         const {
             accountNumber
         } = req.body;
         newUser.getUser(res, accountNumber)
     },
    getUsers: (req, res) => {
        newUser.getUsers(res)
    }
}