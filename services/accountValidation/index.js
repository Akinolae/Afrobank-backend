  const customer = require("../../model/customer");
  const Customer = require("../../controller/index");
  const newCustomer = new Customer(customer);

  module.exports = {
    validateAccount: (req, res) => {
        const { accountNumber } = req.body;
        newCustomer.getUser(accountNumber, res);
    }
  }