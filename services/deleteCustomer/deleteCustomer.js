const { sequelize} = require("../../config/database/dbconnect");
const {customer} = require("../../model/customer");
const Customer = require("../../controller/index");

module.exports = {
    deleteCustomer: (req, res) => {
        const {id } = req.params;
        const newCustomer = new Customer(sequelize, customer);
        newCustomer.deleteCustomer(id, res);
    }
}