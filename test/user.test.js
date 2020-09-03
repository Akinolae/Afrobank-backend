const axios = require("axios");
require("dotenv").config();

// Pin reset
describe("POST@/resetPin", () => {
  test("Validate that a user can update his pin number", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/pinreset", {
      accountNumber: "7055976824",
      pin: "2000"
    })
    expect(result.status).toEqual(200)
    // console.log(result);
  });
})

// fetch user.
describe("GET@/user", () => {
  test("should fetch a particular user with status 200", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/user", {
      accountNumber: "7055976824",
    });
    expect(result.status).toEqual(200);
  });
});

// register user
describe("POST@/register", () => {
  test("it should register a new user to the platform", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/register", {
      firstname: "Pepsi",
      lastname: "Pedro",
      surname: "Dave",
      email: "omoyele@yahoo.com",
      phonenumber: "08034335045",
      gender: "f",
    });
    expect(result.status).toEqual(200);
  });
});

// get all users
describe("GET@/users", () => {
  test("It should return all the users on the platform", async () => {
    const result = await axios.get("http://localhost:4000/Api/v1/users");
    expect(result.status).toEqual(200);
  });
});

// get balance
describe("GET@/balance", () => {
  it("Returns the account balance of a single user", async () => {
    const id = "7055976824";
    const result = await axios.get(
      `http://localhost:4000/Api/v1/balance/${id}`
    );
    expect(result.status).toEqual(200);
  });
});

// transfer
describe("POST@/transfer", () => {
  test("Customer should be able to transfer cash between customers", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/transfer", {
      sender: process.env.ACCOUNTNUMBER,
      recipient: process.env.RECIPIENT,
      amount: 1000,
      pin: process.env.PIN
    });
    expect(result.status).toEqual(200);
  });
});

// user login
describe("POST@/login", () => {
  test("Validates that the user that logged in is the valid user", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/login", {
      accountnumber: process.env.ACCOUNTNUMBER,
      firstname: process.env.FIRSTNAME,
    });
    expect(result.status).toEqual(200);
  });
});