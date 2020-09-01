const axios = require("axios");
const db = require("../config/database/dbconnect");

// describe("DATABASE", () => {
// it("checks that the database is connected", () => {
// const connceted = db.connect();
// console.log(connceted);
// })
// })

describe("GET@/user", () => {
    test("should fetch a particular user with status 200", async () => {
      const result = await axios.post("http://localhost:4000/Api/v1/user", {
        accountNumber: "3254245952",
      });
      expect(result.status).toEqual(200);
    });
});

describe("POST@/register", () => {
  test("it should register a new user to the platform", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/register", {
      firstname: "Femi",
      lastname: "Pedro",
      surname: "David",
      email: "Femifedro@gmail.com",
      phonenumber: "08034335045",
      gender: "m",
    });
    expect(result.status).toEqual(200);
  });
});

describe("GET@/users", () => {
  test("It should return all the users on the platform", async () => {
    const result = await axios.get("http://localhost:4000/Api/v1/users");
    expect(result.status).toEqual(200);
  });
});

// describe("GET@/balance", () => {
//   it("Returns the account balance of a single user", async () => {
// const id = "3254245952";
// const result = await axios.get(
//   `http://localhost:4000/Api/v1/balance/${id}`
// );
// expect(result.status).toEqual(200);
// expect(result.data.message[0]).toMatchObject({
//   accountBalance: "877100",
// });
// console.log(result.data.message[0]);
//   });
// });
//
describe("POST@/transfer", () => {
  test("Customer should be able to transfer cash between customers", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/transfer", {
      sender: "3961826316",
      recipient: "3254245952",
      amount: 2000,
    });
    expect(result.status).toEqual(200);
  });
});

describe("POST@/login",  () => {
  test("Validates that the user that logged in is the valid user", async () => {
    const result = await axios.post("http://localhost:4000/Api/v1/login", {
      accountnumber: process.env.ACCOUNTNUMBER,
      firstname: process.env.FIRSTNAME,
    });
      expect(result.status).toEqual(200);
  });
});
