const customer = require("../../model/customer");
const Customer = require("../../controller/index");
const newUser = new Customer(customer);


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