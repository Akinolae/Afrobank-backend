const customer = require("../../model/customer");
const Customer = require("../../controller/index");

module.exports = {
  pinReset: (req, res) => {
    const { accountNumber, pin } = req.body;
    const newCustomer = new Customer(customer);
    newCustomer.setPin(accountNumber, pin, res);
  },
};
