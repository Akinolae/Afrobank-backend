const customer = require("../../controller/index");

module.exports = {
    getAccountBalance: (req, res) => {
        const { id } = req.params;
        customer.getBalance(id, res);
    }
}