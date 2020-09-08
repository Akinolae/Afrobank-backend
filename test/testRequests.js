'use strict';

const axios = require("axios");
const {
    customer
} = require("../model/customer")
require("dotenv").config();

const tests = {
    pinReset: () => {
        describe("POST@/resetPin", () => {
            test("Validate that a user can update his pin number", async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/pinreset", {
                    accountNumber: "4887999104",
                    pin: '2000'
                })
                expect(result.status).toBe(200)
            });
        })
    },

    fetchUser: () => {
        // fetch user.
        describe("GET@/user", () => {
            test("should fetch a particular user with status 200", async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/user", {
                    accountNumber: "4887999104",
                });
                expect(result.status).toBe(200);
                expect(result.data.message).not.toBeNull()
            });
        });
    },
    registerCustomer: () => {
        describe("POST@/register", () => {
            test("it should register a new user to the platform", async () => {
                const result = await axios.post("http://localhost:4000/Api/v1/register", {
                    firstname: "Bolanle",
                    lastname: "Damilola",
                    surname: "Stephen",
                    email: "bolanle22@gmail.com",
                    phonenumber: "08034335045",
                    gender: "f",
                });
                expect(result.status).toBe(200);
            });
        });
    },
    // invalidLogin: ()=> {
        //   describe("POST@/login", () => {
            //   test("Validates that the user that logged in is not the valid user", async () => {
                //   const result = await axios.post("http://localhost:4000/Api/v1/login", {
                    //   accountnumber: "211112123",
                    //   firstname: process.env.FIRSTNAME,
                //   });
                //   expect(result.status).not.toBe\\Equal(200);
            //   });
        //   });
    // },
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
                const id = "4887999104";
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
                    sender: process.env.ACCOUNTNUMBER,
                    recipient: process.env.RECIPIENT,
                    amount: 500,
                    pin: process.env.PIN
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
    }

}

module.exports = tests;