'use strict';

const axios = require("axios");
const {
    customer
} = require("../model/customer")
const sequelize = require("../config/database/dbconnect");
require("dotenv").config();
const Customer = require("../controller/index");
const newCustomer = new Customer(sequelize, customer);

const tests = {
    sendEmail : () => {
        describe("sendEmail", () => {
            test("Validates that a user can recieve email notifications", async () => {
                const result = await newCustomer.sendMail("Welcome", "makindeakinola22@gmail.com", "test", "sent from a text script");
                console.log(result);
            })
        })
    },

    pinReset: () => {
        describe("POST@/resetPin", () => {
            test("Validate that a user can update his pin number", async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/pinreset", {
                    accountNumber: process.env.ACCOUNTNUMBER,
                    pin: process.env.PIN
                })
                expect(result.status).toBe(200)
            });
        })
    },
    registerCustomer: () => {
        describe("POST@/register", () => {
            test("it should register a new user to the platform", async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/register", {
                    firstname: "Yemi",
                    lastname: "Makinde",
                    surname: "Ib",
                    email: "yemi@gmail.com",
                    phonenumber: "08034335043",
                    gender: "f",
                });
                expect(result.status).toBe(200);
            });
        });
    },
    fetchUsers: () => {
        // get all users
        describe("GET@/users", () => {
            test("It should return all the users on the platform", async () => {
                const result = await axios.get("http://localhost:4000/Api/v1/users");
                expect(result.status).toBe(200);
            });
        });

    },

    getBalance: () => {
        describe("GET@/balance", () => {
            it("Returns the account balance of a single user", async () => {
                const id = process.env.ACCOUNTNUMBER;
                const result = await axios.get(
                    `http://localhost:4000/Api/v1/balance/${id}`
                );
                expect(result.status).toBe(200);
                expect(result.data.message).not.toBeNull();
            });
        });

    },
    transfer: () => {
        describe("POST@/transfer", () => {
            test("Customer should be able to transfer cash between customers", async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/transfer", {
                    sender:process.env.ACCOUNTNUMBER,
                    recipient: process.env.RECIPIENT,
                    amount: 500,
                    pin: 2000
                });
                expect(result.status).toBe(200);
            });
        });
    },
    customerLogin: () => {
        describe("POST@/login", () => {
            test("Validates that the user that logged in is the valid user", async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/login", {
                    accountnumber: process.env.ACCOUNTNUMBER,
                    firstname: process.env.FIRSTNAME,
                });
                expect(result.status).toBe(200);
                
            });
        });
    },
    customerModel: () => {
        describe("@checks that the dataBase model is not null", () => {
            test("Validates table is not null", async () => {
                expect(customer).not.toBeNull();
            });
        });
    },

    validateAccount: () => {
        describe("@POST/Validate", () =>{
            test("Validates that the account number is valid",
            async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/validate", {
                    accountNumber: process.env.ACCOUNTNUMBER
                })
                expect(result.status).toBe(200);
            })
        }
        )
    }

}

module.exports = tests;