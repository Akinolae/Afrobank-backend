const customer = require("../../controller/index");

module.exports = {
    deleteCustomer: (req, res) => {
        const {id } = req.params;
        customer.deleteCustomer(id, res);
    }
}