"use strict";
require("dotenv").config();
const  customer  = require("../../model/customer");
const Customer = require("../../controller/index");


module.exports = {
  register:(req, res) => {
    const { firstname, lastname, surname, email, phonenumber, gender, } = req.body;
    const newUser = new Customer(customer);
    newUser.register(firstname, lastname, surname, email, phonenumber, gender, res);
  },
};
