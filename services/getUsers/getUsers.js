const customer = require("../../controller/index");

module.exports = {
     getUser: (req, res) => {
         const {
             accountNumber
         } = req.body;
         customer.getUser( accountNumber , res)
     },
    getUsers: (req, res) => {
        customer.getUsers(res)
    }
}