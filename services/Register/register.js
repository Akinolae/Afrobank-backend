"use strict";
require("dotenv").config();
const  customer  = require("../../model/customer");
const Customer = require("../../controller/index");


module.exports = {
  register:(req, res) => {
    const { firstName, lastName, surName, email, phoneNumber, gender, } = req.body;
    const newUser = new Customer(customer);
    newUser.register(firstName, lastName, surName, email, phoneNumber, gender, res);
  },
};
