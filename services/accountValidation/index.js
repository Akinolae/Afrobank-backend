  const customer = require("../../controller/index");

  module.exports = {
    validateAccount: (req, res) => {
        const { accountNumber } = req.body;
        customer.getUser(accountNumber, res);
    }
  }