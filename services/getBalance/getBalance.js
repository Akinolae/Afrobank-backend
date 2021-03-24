const customer= require("../../model/customer");
const Customer = require("../../controller/index");

module.exports = {
    getAccountBalance: (req, res) => {
        const {
            id
        } = req.params;
        const newCustomer = new Customer(customer);
        newCustomer.getBalance(id, res);
    }
}